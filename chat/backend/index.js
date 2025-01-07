const { Server } = require('socket.io');

const io = new Server({
  cors: {
    origin: "*", // In production, replace with your frontend domain
    methods: ["GET", "POST"]
  }
});

// Stub for database operations
const db = {
  async saveMessage(message, room, timestamp) {
    // TODO: Implement MongoDB save operation
    console.log('Saving message:', { message, room, timestamp });
    return true;
  },

  async getMessages(room) {
    // TODO: Implement MongoDB fetch operation
    console.log('Fetching messages for room:', room);
    return [
      // Example message format
      {
        content: 'Welcome to the chat!',
        timestamp: new Date(),
        room: room
      }
    ];
  }
};

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Handle room joining
  socket.on('join_room', async (room) => {
    // Leave previous rooms (if any)
    socket.rooms.forEach(room => {
      if (room !== socket.id) { // Socket.IO automatically adds socket.id as a room
        socket.leave(room);
      }
    });

    // Join new room
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);

    try {
      // Fetch and send message history
      const messages = await db.getMessages(room);
      socket.emit('message_history', messages);
    } catch (error) {
      console.error('Error fetching message history:', error);
      socket.emit('error', 'Error loading message history');
    }
  });

  // Handle new messages
  socket.on('send_message', async (messageData) => {
    try {
      const room = Array.from(socket.rooms)[1]; // Get current room (excluding socket.id room)
      if (!room) {
        socket.emit('error', 'Not connected to any room');
        return;
      }

      const message = {
        ...messageData,
        timestamp: new Date(),
        room: room,
        senderId: socket.id
      };

      // Save to database
      await db.saveMessage(message.content, room, message.timestamp);

      // Broadcast to all clients in the room except sender
      socket.to(room).emit('new_message', message);

      // Confirm message receipt to sender
      socket.emit('message_sent', message);

    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', 'Error processing message');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
io.listen(PORT);
console.log(`Socket.IO server running on port ${PORT}`);