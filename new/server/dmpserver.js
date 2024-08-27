
/**
 * Patch object:
 * {
 *  hash: string, // the hash of the text the patch is applied to. If this does not match the current hash, we are potentially out of sync and should send a full text update to everyone.
 *  patch: string // the patch to apply to the text
 * }
 */

import { Server } from 'socket.io';
import sha1 from 'sha1';
import DiffMatchPatch from 'diff-match-patch';

const { Server } = require('socket.io');
const io = new Server(3000);
const dmp = new DiffMatchPatch();

let sharedText = "Hello, World!";

io.on('connection', (socket) => {
  // In the beginning, send the full text to the client
  console.log('a user connected');
  io.send('fulltext', sharedText);


  // Clients can request the full text at any time
  io.on('fulltext-request', () => {
    io.send('fulltext', sharedText);
  });

  // Clients can update the server full text by sending a fulltext-update message
  io.on('fulltext-update', (msg) => {
    sharedText = msg;
    io.emit('fulltext', sharedText);
  }
  );

  // Clients can send patches to the server
  io.on('patch', (msg) => {
    // first check if the patch should be applied to the current text
    const myHash = sha1(sharedText);
    if (myHash !== msg.hash) {
      // we are out of sync, send the full text
      console.log('Hash mismatch, sending full text');
      io.emit('fulltext', sharedText);
      return;
    }

    // golden path: we are in sync, apply the patch
    // send the patch to everyone
    io.emit('patch', { hash: myHash, patch: msg.patch });

    // apply the patch locally
    const [newText, results] = dmp.patch_apply(msg.patch, sharedText);
    sharedText = newText;
  }
  );

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

console.log('Socket.IO server running on port 3000');