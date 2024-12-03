import * as Y from 'yjs';
import WebSocket from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

// Create a single shared document
const docs = new Map();

function getYDoc(docName) {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);
  }
  return doc;
}

const websocketServer = new WebSocket.Server({ port: 1234 });

websocketServer.on('connection', (websocket, req) => {
  const url = new URL(req.url, 'ws://localhost:1234');
  const docName = url.pathname.slice(1);

  // Get or create the document
  const doc = getYDoc(docName);

  // Set up the connection using y-websocket's utility
  setupWSConnection(websocket, req, {
    docName: docName,
    gc: true,
    onchange: (event) => {
      console.log('Broadcasting document update:', docName);
    },
  });

  console.log('Client connected to document:', docName);

  websocket.on('close', () => {
    console.log('Client disconnected from document:', docName);
  });
});

// Optional: Cleanup on server shutdown
process.on('SIGINT', () => {
  docs.forEach(doc => {
    doc.destroy();
  });
  process.exit(0);
});