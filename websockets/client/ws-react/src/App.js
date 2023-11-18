import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

function App() {

  const [textState, setTextState] = useState("")

  const handleChange = (event) => {
    setTextState(event.target.value);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <textarea
        value={textState}
        onChange={handleChange}
        rows={30} // Specifies the number of visible text lines
        cols={70} // Specifies the visible width of the text area
        placeholder="Enter your text here..."
      />
    </div>
  );
}

export default App;
