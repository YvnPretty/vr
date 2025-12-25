import React, { useState, useEffect, useRef } from 'react';
import { Camera, Target, Scan, Shield, AlertTriangle, RefreshCw, Zap, Hand } from 'lucide-react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState('active');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [handPos, setHandPos] = useState({ x: 50, y: 50 });
  const [isHandActive, setIsHandActive] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [isPalmOpen, setIsPalmOpen] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentColor, setCurrentColor] = useState('#00ffff');
  const [particles, setParticles] = useState([]);
  const [activePanel, setActivePanel] = useState('main');
  const [systemLogs, setSystemLogs] = useState(["INITIALIZING JARVIS OS...", "NEURAL LINK ESTABLISHED", "SENSORS ONLINE"]);
  const [targetLock, setTargetLock] = useState(0);
  const [allLandmarks, setAllLandmarks] = useState(null);
  const [handZ, setHandZ] = useState(0);
  const handsRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const lastPosRef = useRef({ x: 50, y: 50 });
  const isPinchingRef = useRef(false);
  const pinchDistRef = useRef(0);
  const [cameraMode, setCameraMode] = useState('environment'); // 'environment' o 'user'

  // --- 1. Inicialización de Cámara y Hand Tracking ---
  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        setAllLandmarks(landmarks);

        const thumb = landmarks[4];
        const index = landmarks[8];
        const pinky = landmarks[20];

        // Profundidad Z (distancia a la cámara)
        const z = Math.abs(landmarks[0].z) * 100;
        setHandZ(z);

        const rawX = index.x * 100;
        const rawY = index.y * 100;
        const smoothing = 0.3;
        const smoothX = lastPosRef.current.x + (rawX - lastPosRef.current.x) * smoothing;
        const smoothY = lastPosRef.current.y + (rawY - lastPosRef.current.y) * smoothing;

        lastPosRef.current = { x: smoothX, y: smoothY };
        setHandPos({ x: smoothX, y: smoothY });
        setIsHandActive(true);

        const pinchDist = Math.sqrt(Math.pow(index.x - thumb.x, 2) + Math.pow(index.y - thumb.y, 2));
        const palmDist = Math.sqrt(Math.pow(pinky.x - thumb.x, 2) + Math.pow(pinky.y - thumb.y, 2));
        pinchDistRef.current = pinchDist;

        const pinching = pinchDist < 0.1; // Umbral más generoso
        const palmOpen = palmDist > 0.22;

        setIsPinching(pinching);
        setIsPalmOpen(palmOpen);

        // Lógica de Selección de Color (Hover)
        if (!pinching && !palmOpen) {
          if (smoothY > 85 && smoothX > 30 && smoothX < 70) {
            const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
            const idx = Math.floor((smoothX - 30) / 10);
            if (colors[idx]) setCurrentColor(colors[idx]);
          }
        }

        if (pinching) {
          setTargetLock(0);
          // Emitir partículas
          setParticles(prev => [
            ...prev,
            { x: smoothX, y: smoothY, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 1, color: currentColor }
          ].slice(-30));

          if (!isPinchingRef.current) {
            isPinchingRef.current = true;
            const thickness = Math.max(5, 20 - z / 3);
            setPaths(prev => [...prev, { points: [{ x: smoothX, y: smoothY }], color: currentColor, thickness }]);
            console.log("START DRAWING");
          } else {
            setPaths(prev => {
              const newPaths = [...prev];
              const lastIdx = newPaths.length - 1;
              if (lastIdx >= 0) {
                newPaths[lastIdx] = {
                  ...newPaths[lastIdx],
                  points: [...newPaths[lastIdx].points, { x: smoothX, y: smoothY }]
                };
              }
              return newPaths;
            });
          }
        } else {
          if (isPinchingRef.current) console.log("STOP DRAWING");
          isPinchingRef.current = false;
          if (palmOpen) {
            setPaths(prev => prev.map(path => ({
              ...path,
              points: path.points.filter(p => {
                const d = Math.sqrt(Math.pow(p.x - smoothX, 2) + Math.pow(p.y - smoothY, 2));
                return d > 12; // Radio de borrado mayor
              })
            })).filter(path => path.points.length > 0));
            setTargetLock(0);
          } else {
            setTargetLock(prev => Math.min(100, prev + 2));
          }
        }
      } else {
        setIsHandActive(false);
        setIsPinching(false);
        setIsPalmOpen(false);
        setTargetLock(0);
        setAllLandmarks(null);
        isPinchingRef.current = false;
      }
    });

    handsRef.current = hands;

    const camera = new cam.Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: 1280,
      height: 720,
      facingMode: cameraMode
    });

    // En iOS, a veces se necesita un gesto del usuario para iniciar
    const startCamera = () => {
      camera.start();
    };

    window.addEventListener('start-camera', startCamera);

    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
      console.log("iOS detected, waiting for user gesture");
    } else {
      camera.start();
    }

    return () => {
      camera.stop();
      window.removeEventListener('start-camera', startCamera);
      if (handsRef.current) handsRef.current.close();
    };
  }, [cameraMode]);

  const toggleCamera = () => {
    setCameraMode(prev => prev === 'environment' ? 'user' : 'environment');
    setIsCameraReady(false);
  };

  // --- 2. Lógica de Dibujo y Logs ---
  useEffect(() => {
    const handleResize = () => {
      if (drawCanvasRef.current) {
        drawCanvasRef.current.width = window.innerWidth;
        drawCanvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);

    // Dibujar Partículas (Sin mutación directa)
    particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * window.innerWidth / 100, p.y * window.innerHeight / 100, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Actualizar partículas en el siguiente frame
    if (particles.length > 0) {
      const anim = requestAnimationFrame(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        })).filter(p => p.life > 0));
      });
      return () => cancelAnimationFrame(anim);
    }
    ctx.globalAlpha = 1;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;

    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.lineWidth = path.thickness || 4;
      ctx.strokeStyle = path.color;
      ctx.shadowColor = path.color;

      ctx.moveTo(path.points[0].x * window.innerWidth / 100, path.points[0].y * window.innerHeight / 100);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x * window.innerWidth / 100, path.points[i].y * window.innerHeight / 100);
      }
      ctx.stroke();
    });
  }, [paths, particles]);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const events = [
        "SCANNING NEURAL PATHWAYS...",
        "ATMOSPHERIC DATA UPDATED",
        "ENCRYPTING HAND DATA...",
        "JARVIS CORE: STABLE",
        "SYNCING WITH SATELLITE...",
        "THERMAL SENSORS ACTIVE",
        `PINCH SENSITIVITY: ${isPinching ? 'HIGH' : 'NORMAL'}`
      ];
      setSystemLogs(prev => [events[Math.floor(Math.random() * events.length)], ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(logInterval);
  }, [isPinching]);

  const clearCanvas = () => setPaths([]);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-white select-none">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        muted
        onLoadedMetadata={() => setIsCameraReady(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover z-0 opacity-90 grayscale-[0.2] contrast-125 transition-opacity duration-1000 ${isCameraReady ? 'opacity-90' : 'opacity-0'}`}
      />

      {!isCameraReady && !error && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="text-cyan-500 animate-spin mb-8" size={80} />
          <h2 className="text-cyan-400 font-black text-2xl mb-4 tracking-[0.4em] uppercase">Jarvis OS v5.5</h2>
          <p className="text-cyan-500/60 text-sm mb-12 max-w-xs uppercase tracking-widest leading-relaxed">
            Inicializando protocolos de Realidad Aumentada...
          </p>

          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.play();
                window.dispatchEvent(new CustomEvent('start-camera'));
              }
            }}
            className="ar-box px-12 py-6 border-2 border-cyan-500 bg-cyan-500/20 text-cyan-400 font-black text-lg tracking-[0.5em] hover:bg-cyan-500 hover:text-white transition-all active:scale-95 pointer-events-auto shadow-[0_0_30px_rgba(0,255,255,0.3)]"
          >
            SYNC NEURAL LINK
          </button>
        </div>
      )}

      <canvas
        ref={drawCanvasRef}
        className="absolute inset-0 z-35 pointer-events-none"
      />

      {/* Holographic Hand Skeleton */}
      {allLandmarks && (
        <svg className="absolute inset-0 z-40 pointer-events-none w-full h-full opacity-40">
          {[
            [0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [5, 9, 10, 11, 12],
            [9, 13, 14, 15, 16], [13, 17, 18, 19, 20], [0, 17]
          ].map((path, i) => (
            <polyline
              key={i}
              points={path.map(idx => `${allLandmarks[idx].x * 100},${allLandmarks[idx].y * 100}`).join(' ')}
              fill="none"
              stroke="#00ffff"
              strokeWidth="0.5"
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />
          ))}
          {allLandmarks.map((lm, i) => (
            <circle
              key={i}
              cx={`${lm.x * 100}%`}
              cy={`${lm.y * 100}%`}
              r="2"
              fill={i === 8 ? "#fff" : "#00ffff"}
            />
          ))}
        </svg>
      )}

      {isHandActive && handPos && (
        <div
          className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: `${handPos.x}%`,
            top: `${handPos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative flex items-center justify-center">
            {targetLock > 0 && (
              <svg className="absolute w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="2" />
                <circle
                  cx="64" cy="64" r="60"
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="2"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * targetLock) / 100}
                  className="transition-all duration-100"
                />
              </svg>
            )}

            <div className={`absolute w-16 h-16 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite] ${isPinching ? 'scale-75' : 'scale-100'}`}></div>
            <div className={`absolute w-20 h-20 border border-dashed border-cyan-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]`}></div>

            <div className={`w-12 h-12 border-2 rounded-full transition-all duration-300 flex items-center justify-center
              ${isPinching ? 'border-white bg-white/20 scale-75' :
                isPalmOpen ? 'border-red-500 bg-red-500/20 scale-125' :
                  'border-cyan-400 shadow-[0_0_20px_cyan]'}`}>
              {isPalmOpen ? <RefreshCw size={20} className="text-red-400 animate-spin" /> :
                targetLock === 100 ? <Target size={20} className="text-white animate-ping" /> : null}
            </div>

            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap bg-black/60 px-2 py-0.5 rounded border
                ${isPinching ? 'text-white border-white' :
                  isPalmOpen ? 'text-red-400 border-red-400' :
                    targetLock === 100 ? 'text-yellow-400 border-yellow-400' :
                      'text-cyan-400 border-cyan-400'}`}
                style={{ borderColor: isPinching ? currentColor : undefined, color: isPinching ? currentColor : undefined }}>
                {isPinching ? 'DRAWING' : isPalmOpen ? 'ERASING' : targetLock === 100 ? 'TARGET LOCKED' : 'ANALYZING'}
              </div>
              <div className={`w-[1px] h-4 ${isPalmOpen ? 'bg-red-500' : 'bg-cyan-500/50'}`}></div>
            </div>

            {/* Z-Depth Indicator */}
            <div className="absolute -right-16 top-0 h-20 w-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="w-full bg-cyan-400 transition-all duration-200"
                style={{ height: `${handZ}%`, marginTop: `${100 - handZ}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-10">
        <div className="w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_cyan] animate-[scan_4s_linear_infinite]" />
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100vh); }
          to { transform: translateY(100vh); }
        }
        .ar-box {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(34, 211, 238, 0.4);
          backdrop-filter: blur(12px);
          border-radius: 8px;
        }
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>

      <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 pointer-events-none">
        {/* Header - Modular y Espaciado */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="ar-box p-4 border-l-4 border-l-cyan-500 flex-1 mr-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_10px_cyan]"></div>
                <h1 className="text-cyan-400 text-xs font-black uppercase tracking-[0.2em]">Jarvis OS v5.5</h1>
              </div>
              <div className="text-xl font-mono font-bold tracking-tighter text-white/90">
                {time.toLocaleTimeString([], { hour12: false })}
              </div>
            </div>

            <button
              onClick={toggleCamera}
              className="pointer-events-auto ar-box p-4 border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center justify-center"
              title="Voltear Cámara"
            >
              <RefreshCw size={24} className="text-cyan-400" />
            </button>
          </div>

          {/* Logs - Apilados Verticalmente */}
          <div className="ar-box p-3 w-full max-w-[280px] border-cyan-500/20">
            <div className="text-[8px] text-cyan-500/50 uppercase font-bold mb-2 tracking-widest">System Telemetry</div>
            <div className="space-y-1.5">
              {systemLogs.map((log, i) => (
                <div key={i} className="text-[9px] text-cyan-400/80 font-mono truncate animate-in slide-in-from-left duration-300">
                  {`> ${log}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
          <div className="relative w-80 h-80 flex items-center justify-center">
            <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_30s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-dashed border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
            <div className="absolute inset-10 border-2 border-t-cyan-500/40 border-r-transparent border-b-cyan-500/40 border-l-transparent rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="w-10 h-[1px] bg-cyan-500/50"></div>
            <div className="h-10 w-[1px] bg-cyan-500/50 absolute"></div>
          </div>
        </div>

        {/* Footer - Diseño Modular y Botones Grandes */}
        <div className="flex flex-col gap-6">
          {/* Paleta de Colores - Botones de 44px+ */}
          <div className="flex justify-center">
            <div className="ar-box p-3 flex gap-4 items-center pointer-events-auto shadow-2xl border-white/10">
              {['#00ffff', '#ff00ff', '#ffff00', '#00ff00'].map(c => (
                <button
                  key={c}
                  className={`w-11 h-11 rounded-full border-2 transition-all active:scale-90 ${currentColor === c ? 'scale-110 border-white shadow-[0_0_20px_white]' : 'border-transparent opacity-40'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCurrentColor(c)}
                />
              ))}
              <div className="w-[1px] h-8 bg-white/20 mx-1"></div>
              <button
                onClick={clearCanvas}
                className="w-11 h-11 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end gap-4">
            <div className="flex gap-3 pointer-events-auto">
              <button
                onClick={() => setActivePanel('main')}
                className={`ar-box p-5 transition-all active:scale-90 ${activePanel === 'main' ? 'bg-cyan-500/30 border-cyan-400' : 'opacity-40'}`}
              >
                <Target size={32} className="text-cyan-400" />
              </button>
              <button
                onClick={() => setActivePanel('weather')}
                className={`ar-box p-5 transition-all active:scale-90 ${activePanel === 'weather' ? 'bg-cyan-500/30 border-cyan-400' : 'opacity-40'}`}
              >
                <Scan size={32} className="text-cyan-400" />
              </button>
            </div>

            <div className="ar-box p-4 flex-1 max-w-[180px] border-b-4 border-b-cyan-500">
              <div className="text-[10px] text-cyan-500 font-black uppercase mb-2 tracking-widest flex items-center gap-2">
                <Hand size={14} /> Biometrics
              </div>
              <div className="space-y-2 text-[10px] text-gray-400 font-mono">
                <div className="flex justify-between">
                  <span>STRESS:</span>
                  <span className="text-cyan-400">LOW</span>
                </div>
                <div className="flex justify-between">
                  <span>PINCH:</span>
                  <span className={`font-bold ${isPinching ? 'text-green-400' : 'text-yellow-400'}`}>
                    {pinchDistRef.current?.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
        {activePanel === 'weather' && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 pointer-events-auto">
            <div className="ar-box w-full max-w-sm p-8 animate-in zoom-in duration-300">
              <h2 className="text-cyan-400 font-black text-2xl mb-8 tracking-widest uppercase border-b border-cyan-500/20 pb-4">Environmental Scan</h2>
              <div className="grid grid-cols-1 gap-6 mb-10">
                {[
                  { label: 'Luminosity', val: '84%', color: 'text-white' },
                  { label: 'Atmosphere', val: 'Stable', color: 'text-white' },
                  { label: 'Visibility', val: 'High', color: 'text-green-400' },
                  { label: 'Threat Level', val: 'Zero', color: 'text-blue-400' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[11px] text-cyan-500/60 uppercase font-bold">{item.label}</span>
                    <span className={`text-xl font-black ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActivePanel('main')}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-xl font-black text-lg tracking-[0.3em] uppercase transition-all active:scale-95 shadow-lg"
              >
                Close Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
