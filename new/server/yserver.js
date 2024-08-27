const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

// Create a Yjs document
const doc = new Y.Doc();

// Create a text type in the Yjs document
const yText = doc.getText('text');

doc.on("update", (update,origin) => {
  console.log("hi")
});

// Initialize the WebSocket server
const wss = new WebSocket.Server({ port: 1234 });

wss.on('connection', (ws) => {
  setupWSConnection(ws, doc);
});

console.log('WebSocket server is listening on port 1234');
