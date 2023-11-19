const WebSocket = require('ws');

// The text variable that will store the current text
let sharedText = '';

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 12345 });

// Broadcast function to send data to all connected clients
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Set up the WebSocket connection event
wss.on('connection', (ws) => {
  console.log('A new client connected.');

  // Send the current text to the newly connected client
  ws.send(JSON.stringify({ type: 'text', data: sharedText }));

  // Set up the message event
  ws.on('message', (message) => {
    const msg = JSON.parse(message);

    // Handle different types of messages
    switch (msg.type) {
      case 'get-text':
        // Send the current text to the client
        ws.send(JSON.stringify({ type: 'text', data: sharedText }));
        break;
      case 'update-text':
        // Update the shared text
        sharedText = msg.data;
        // Broadcast the updated text to all clients
        broadcast(JSON.stringify({ type: 'text', data: sharedText }));
        console.log('Text updated:', sharedText);
        break;
      default:
        console.log('Unknown message type:', msg.type);
    }
  });
});

console.log('Collaborative text WebSocket server is running on ws://localhost:3000');
