import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [sharedText, setSharedText] = useState("")
  const [socket, setSocket] = useState(null);

  // Create WebSocket connection.
  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket('ws://localhost:12345');

    // Connection opened
    socket.addEventListener('open', function (event) {
      console.log('Connected to the WebSocket server');
      socket.send(JSON.stringify({ type: 'get-text' }));
    });

    // Listen for messages
    socket.addEventListener('message', function (event) {
      const msg = JSON.parse(event.data);
      if (msg.type === 'text') {
        // Update the text
        setSharedText(msg.data)
      }
    });

    // Update the state with the WebSocket instance
    setSocket(socket);

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, []);

  // Function to call when the text is updated by the user
  function sendText(newText) {
    // Send the updated text to the server
    const textToSend = newText;
    socket.send(JSON.stringify({ type: 'update-text', data: textToSend }));
  }

  const handleChange = (event) => {
    if (event.target.value === sharedText) return;
    setSharedText(event.target.value);
    sendText(event.target.value);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <textarea
        value={sharedText}
        onChange={handleChange}
        rows={30} // Specifies the number of visible text lines
        cols={70} // Specifies the visible width of the text area
        placeholder="Enter your text here..."
      />
    </div>
  );
}

export default App;
