import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

const ChatRoom = ({ room = 'default', username }) => {
  // State to store prev. messages
  const [messages, setMessages] = useState([]);
  // State to store new message
  const [newMessage, setNewMessage] = useState('');

  // state to store the connection to the server
  const [socket, setSocket] = useState(null);

  // Used to scroll to the bottom of the chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // When the component loads, we connect to the server
    // TODO: change port if it clashes
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // We define what happens when certain events happen
    newSocket.on('connect', () => {
      // The connect event is fired when the socket connects to the server
      console.log('Connected to server');
      // It then makes a request to the server to get all the messages in the room
      newSocket.emit('join_room', room);
    });

    newSocket.on('message_history', (history) => {
      // This is run when the answer from the server to our request for message history is received
      // we just set the messages state to the history
      setMessages(history);
      scrollToBottom();
    });

    newSocket.on('new_message', (message) => {
      // This is run when a new message is received from the server
      // (Someone else sent a message, we are receiving it now)
      // We just add it to the history
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('message_sent', (message) => {
      // This is run when the server confirms that our message was received
      // It does the same as the new_message event
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      // When the component unmounts, we close the connection
      newSocket.close();
    };
  }, [room]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send_message', {
        content: newMessage.trim(),
        username: username
      });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold">Chat Room: {room}</h2>
          <p className="text-gray-600">Logged in as: {username}</p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${msg.senderId === socket?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                    }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.username || 'Anonymous'}
                  </div>
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-75">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
ChatRoom.propTypes = {
  room: PropTypes.string,
  username: PropTypes.string.isRequired,
};

export default ChatRoom;