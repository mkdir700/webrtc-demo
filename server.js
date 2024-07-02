const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const serverOptions = {
    key: fs.readFileSync('./172.12.0.9-key.pem'),
    cert: fs.readFileSync('./172.12.0.9.pem')
};
const server = https.createServer(serverOptions);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        // Broadcast the message to all clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                console.log('broadcasting message', message);
                client.send(message);
            }
        });
    });
});

console.log('WebSocket server is running on wss://172.12.0.9:8080');
server.listen(8080);