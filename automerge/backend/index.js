import * as Y from 'yjs';
import WebSocket from 'ws';
import { WebsocketProvider } from 'y-websocket';

const wss = new WebSocket.Server({ port: 1234 });

wss.on('connection', (ws) => {
  // Create a Yjs document when a new client connects
  const ydoc = new Y.Doc();

  // Create a WebSocket provider and sync the document across clients
  const provider = new WebsocketProvider('ws://localhost:1234', 'your-document-id', ydoc);

  // When a message is received from the client, broadcast it to other clients
  ws.on('message', (message) => {
    // Handle incoming messages (optional logic for processing messages)
  });
});