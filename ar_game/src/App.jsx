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

        const pinching = pinchDist < 0.04;
        const palmOpen = palmDist > 0.18;

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
          ].slice(-20));

          setPaths(prev => {
            const thickness = Math.max(2, 10 - z / 5);
            if (!isPinchingRef.current) {
              isPinchingRef.current = true;
              return [...prev, { points: [{ x: smoothX, y: smoothY }], color: currentColor, thickness }];
            } else {
              const newPaths = [...prev];
              const lastPath = newPaths[newPaths.length - 1];
              if (lastPath) {
                lastPath.points.push({ x: smoothX, y: smoothY });
              }
              return newPaths;
            }
          });
        } else {
          isPinchingRef.current = false;
          if (palmOpen) {
            setPaths(prev => prev.map(path => ({
              ...path,
              points: path.points.filter(p => {
                const d = Math.sqrt(Math.pow(p.x - smoothX, 2) + Math.pow(p.y - smoothY, 2));
                return d > 8;
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
    });

    camera.start();

    return () => {
      camera.stop();
      if (handsRef.current) handsRef.current.close();
    };
  }, []);

  // --- 2. Lógica de Dibujo y Logs ---
  useEffect(() => {
    if (!drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d');
    drawCanvasRef.current.width = window.innerWidth;
    drawCanvasRef.current.height = window.innerHeight;

    ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);

    // Dibujar Partículas
    particles.forEach((p, i) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * window.innerWidth / 100, p.y * window.innerHeight / 100, 2, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
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
        "THERMAL SENSORS ACTIVE"
      ];
      setSystemLogs(prev => [events[Math.floor(Math.random() * events.length)], ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(logInterval);
  }, []);

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
        muted
        onLoadedMetadata={() => setIsCameraReady(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover z-0 opacity-90 grayscale-[0.2] contrast-125 transition-opacity duration-1000 ${isCameraReady ? 'opacity-90' : 'opacity-0'}`}
      />

      {!isCameraReady && !error && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <RefreshCw className="text-cyan-500 animate-spin mb-4" size={48} />
          <p className="text-cyan-400 animate-pulse uppercase tracking-[0.2em] text-xs">Inicializando Sensores AR...</p>
        </div>
      )}

      <canvas
        ref={drawCanvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
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
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(34, 211, 238, 0.5);
          backdrop-filter: blur(8px);
          border-radius: 4px;
        }
      `}</style>

      <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="ar-box p-4 border-l-4 border-l-cyan-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_10px_cyan]"></div>
                <h1 className="text-cyan-400 text-sm font-black uppercase tracking-[0.3em]">Jarvis OS v5.2</h1>
              </div>
              <div className="text-2xl font-mono font-bold tracking-tighter text-white/90">
                {time.toLocaleTimeString([], { hour12: false })}
              </div>
            </div>

            <div className="ar-box p-3 w-48 h-16 overflow-hidden border-cyan-500/20">
              <div className="text-[7px] text-cyan-500/50 uppercase font-bold mb-1">System Logs</div>
              <div className="space-y-1">
                {systemLogs.map((log, i) => (
                  <div key={i} className="text-[8px] text-cyan-400/80 font-mono truncate animate-in slide-in-from-left duration-300">
                    {`> ${log}`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="ar-box p-3 text-right border-r-4 border-r-yellow-500">
              <div className="text-[10px] text-yellow-500 uppercase font-black mb-1">Neural Link</div>
              <div className="flex items-center gap-2 justify-end">
                <div className={`w-1 h-3 bg-yellow-500/30 ${isHandActive ? 'animate-pulse' : ''}`}></div>
                <div className={`w-1 h-5 bg-yellow-500/50 ${isHandActive ? 'animate-pulse delay-75' : ''}`}></div>
                <div className={`w-1 h-4 bg-yellow-500 ${isHandActive ? 'animate-pulse delay-150' : ''}`}></div>
                <span className="text-xs font-bold text-white">{isHandActive ? 'CONNECTED' : 'SEARCHING'}</span>
              </div>
            </div>
            <button
              onClick={clearCanvas}
              className="pointer-events-auto ar-box p-3 hover:bg-red-500/20 border-red-500/50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} className="text-red-400" />
              <span className="text-[10px] font-black text-red-400 uppercase">Clear HUD</span>
            </button>
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

        <div className="flex justify-between items-end pointer-events-auto">
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActivePanel('main')}
                className={`ar-box p-5 transition-all group ${activePanel === 'main' ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'opacity-40 hover:opacity-100'}`}
              >
                <Target size={28} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setActivePanel('weather')}
                className={`ar-box p-5 transition-all group ${activePanel === 'weather' ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'opacity-40 hover:opacity-100'}`}
              >
                <Scan size={28} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Floating Color Palette */}
            <div className="ar-box p-3 flex gap-3 items-center mb-1 animate-in slide-in-from-bottom duration-500">
              {['#00ffff', '#ff00ff', '#ffff00', '#00ff00'].map(c => (
                <div
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${currentColor === c ? 'scale-125 border-white shadow-[0_0_15px_white]' : 'border-transparent opacity-50'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCurrentColor(c)}
                />
              ))}
              <div className="w-[1px] h-8 bg-white/10 mx-1"></div>
              <div className="text-[8px] text-white/50 uppercase font-black vertical-text">Palette</div>
            </div>
          </div>

          <div className="ar-box p-4 max-w-[220px] border-b-4 border-b-cyan-500">
            <div className="text-[9px] text-cyan-500 font-black uppercase mb-2 tracking-[0.2em] flex items-center gap-2">
              <Hand size={12} /> Biometric Interface
            </div>
            <div className="space-y-2 text-[9px] text-gray-400 font-mono">
              <div className="flex justify-between">
                <span>PULSE:</span>
                <span className="text-green-400">72 BPM</span>
              </div>
              <div className="flex justify-between">
                <span>STRESS:</span>
                <span className="text-cyan-400">LOW</span>
              </div>
              <div className="flex justify-between">
                <span>Z-DEPTH:</span>
                <span className="text-white">{handZ.toFixed(1)}u</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
        {activePanel === 'weather' && (
          <div className="ar-box p-8 animate-in zoom-in fade-in duration-500 pointer-events-auto max-w-md w-full">
            <h2 className="text-cyan-400 font-black text-xl mb-6 tracking-widest uppercase border-b border-cyan-500/20 pb-4">Environmental Analysis</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-500/60 uppercase">Luminosity</div>
                <div className="text-2xl font-bold">84%</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-500/60 uppercase">Atmosphere</div>
                <div className="text-2xl font-bold">Stable</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-500/60 uppercase">Visibility</div>
                <div className="text-2xl font-bold text-green-400">High</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-500/60 uppercase">Threat Level</div>
                <div className="text-2xl font-bold text-blue-400">Zero</div>
              </div>
            </div>
            <button
              onClick={() => setActivePanel('main')}
              className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 text-white py-3 font-black tracking-widest uppercase transition-all"
            >
              Close Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
