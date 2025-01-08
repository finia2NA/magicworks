const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Server } = require('socket.io');

// This part creates the socket.io server
const io = new Server({
  cors: {
    origin: "*", // In production, replace with your frontend domain
    methods: ["GET", "POST"]
  }
});

// This part creates the db object with methods to save and fetch messages
const db = {
  // Called when sving a message
  async saveMessage(content, roomName, timestamp, socketId, username) {
    // We get the room. if it does not exist, we create it
    try {
      // Find or create the room by name
      let room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        // Create the room if it doesn't exist
        room = await prisma.room.create({
          data: { name: roomName },
        });
      }

      // We save the message to the database
      // Save the message
      const message = await prisma.message.create({
        data: {
          content,
          roomId: room.id,
          socketId,
          username: username || 'Anonymous', // Use 'Anonymous' if no username is provided
          createdAt: timestamp,
        },
      });

      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  // Getting messages from the database
  async getMessages(roomName) {
    try {
      // Find or create the room by name
      let room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        // Create the room if it doesn't exist
        room = await prisma.room.create({
          data: { name: roomName },
        });
      }

      // Fetch messages for the room
      const messages = await prisma.message.findMany({
        where: { roomId: room.id },
        orderBy: { createdAt: 'asc' },
      });

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
};

// Socket.IO connection handling
// This one is called when a client connects to the server.
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Handle room joining
  socket.on('join_room', async (roomName) => {
    // When joining a room, we fetch the message history and send it to the client
    try {
      // Join room and ensure it exists
      const messages = await db.getMessages(roomName);
      socket.join(roomName);
      console.log(`Client ${socket.id} joined room: ${roomName}`);
  
      // Send message history
      socket.emit('message_history', messages);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Error joining room');
    }
  });

  // Handle new messages
  socket.on('send_message', async (messageData) => {
    // When receiving a message, we save it to the database and broadcast it to all clients in the room
    try {
      const room = Array.from(socket.rooms)[1]; // Get current room
      if (!room) {
        socket.emit('error', 'Not connected to any room');
        return;
      }

      const { content, username } = messageData;

      const message = {
        content,
        timestamp: new Date(),
        room,
        senderId: socket.id,
        username: username || 'Anonymous', // Use 'Anonymous' if username is not provided
      };

      // Save to database
      const savedMessage = await db.saveMessage(
        content,
        room,
        message.timestamp,
        socket.id,
        message.username
      );

      // Broadcast to all clients in the room except sender
      socket.to(room).emit('new_message', savedMessage);

      // Confirm message receipt to sender
      socket.emit('message_sent', savedMessage);
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