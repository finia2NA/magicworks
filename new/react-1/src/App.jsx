import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function App() {
  const [text, setText] = useState('');
  const ydocRef = useRef(new Y.Doc());
  const providerRef = useRef(null);
  const yTextRef = useRef(null);

  useEffect(() => {
    // Create a Yjs document
    const ydoc = ydocRef.current;

    // Connect to the Yjs server
    providerRef.current = new WebsocketProvider('ws://localhost:1234', 'my-room', ydoc);

    // Get the Yjs text type
    yTextRef.current = ydoc.getText('text');

    // Sync initial text with Yjs document
    setText(yTextRef.current.toString());

    // Observe changes to the Yjs text type
    yTextRef.current.observe((event) => {
      setText(yTextRef.current.toString());
    });

    return () => {
      providerRef.current.destroy();
      ydoc.destroy();
    };
  }, []);

  const handleChange = (event) => {
    const newValue = event.target.value;
    // Update the Yjs text type
    yTextRef.current.delete(0, yTextRef.current.length);
    yTextRef.current.insert(0, newValue);
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          style={{ width: '300px', padding: '10px', fontSize: '16px' }}
        />
      </header>
    </div>
  );
}

export default App;
