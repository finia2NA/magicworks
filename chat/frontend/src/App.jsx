import './App.css'
import ChatRoom from './components/chat';
import { useState, useRef } from 'react';

function App() {
  const [room, setRoom] = useState(null);
  const [username, setUsername] = useState(null);
  
  const roomRef = useRef();
  const usernameRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    setRoom(roomRef.current.value);
    setUsername(usernameRef.current.value);
  };
return (
  (!room || !username) ? (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        ref={roomRef}
        placeholder="Enter room name"
        required
      />
      <input 
        type="text" 
        ref={usernameRef}
        placeholder="Enter username"
        required
      />
      <button type="submit">Join Chat</button>
    </form>
  ) : (
    <>
    <ChatRoom room={room} username={username} />
    <button onClick={() => {setRoom(null); setUsername(null);}}>Leave Chat</button>
    </>
  )
);
}

export default App