import './App.css'
import ChatRoom from './components/Chat';
import { useState, useRef } from 'react';

function App() {
  /*
  The app shows a form to enter a room name and a username if the room and username are not set.
  This is not done by saving to the states while typing, but by saving *references* to the input elements.
  When the form is submitted, the room and username are set to the values of the input elements.

  The app shows the chat component when both the room and username are set.
  */

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
        <button onClick={() => { setRoom(null); setUsername(null); }}>Leave Chat</button>
      </>
    )
  );
}

export default App