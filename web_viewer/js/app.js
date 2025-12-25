document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connect-btn');
    const statusBadge = document.getElementById('status-badge');
    const posData = document.getElementById('pos-data');
    const rotData = document.getElementById('rot-data');
    const fpsText = document.getElementById('fps');

    let isConnected = false;

    let socket;

    connectBtn.addEventListener('click', () => {
        if (!isConnected) {
            connectToBridge();
        } else {
            disconnectFromBridge();
        }
    });

    function connectToBridge() {
        socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            isConnected = true;
            statusBadge.textContent = 'Conectado';
            statusBadge.className = 'badge connected';
            connectBtn.textContent = 'Desconectar';
            console.log('Connected to Bridge');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateUI(data);
        };

        socket.onclose = () => {
            disconnectFromBridge();
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            disconnectFromBridge();
        };
    }

    function disconnectFromBridge() {
        if (socket) socket.close();
        isConnected = false;
        statusBadge.textContent = 'Desconectado';
        statusBadge.className = 'badge disconnected';
        connectBtn.textContent = 'Conectar al Dispositivo';
    }

    function updateUI(data) {
        // Update Position
        if (data.position) {
            posData.textContent = `${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)}`;
        }

        // Update Rotation
        if (data.rotation) {
            rotData.textContent = `${data.rotation.x.toFixed(2)}, ${data.rotation.y.toFixed(2)}, ${data.rotation.z.toFixed(2)}, ${data.rotation.w.toFixed(2)}`;
        }

        // Update Image
        if (data.imageBuffer) {
            const imgElement = document.getElementById('ar-stream');
            imgElement.src = `data:image/jpeg;base64,${data.imageBuffer}`;
        }

        fpsText.textContent = 'Live';
    }
});
