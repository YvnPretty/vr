const net = require('net');
const WebSocket = require('ws');

const TCP_PORT = 11000;
const WS_PORT = 8080;

// WebSocket Server for Web Clients
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws) => {
    console.log('Web client connected');
    ws.on('close', () => console.log('Web client disconnected'));
});

// TCP Server for Unity
const tcpServer = net.createServer((socket) => {
    console.log('Unity device connected via TCP');

    let buffer = Buffer.alloc(0);

    socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= 4) {
            const length = buffer.readInt32LE(0);
            if (buffer.length >= length + 4) {
                const message = buffer.slice(4, length + 4).toString();
                buffer = buffer.slice(length + 4);

                // Broadcast to all connected web clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            } else {
                break;
            }
        }
    });

    socket.on('close', () => console.log('Unity device disconnected'));
    socket.on('error', (err) => console.error('TCP Error:', err.message));
});

tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`TCP server (Unity) listening on port ${TCP_PORT}`);
});
