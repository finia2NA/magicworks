import { useState, useRef, useMemo } from 'react';
import useColabValue from './useColabValue';

const AwarenessDemo = () => {
  const docID = 'defaultDoc';
  const wsUrl = 'ws:localhost:1234';
  const userID = useMemo(() => `user-${Math.floor(Math.random() * 1000)}`, []);

  // Use the custom hook
  const { text, presentUsers, updateText } = useColabValue(docID, wsUrl, userID);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value);
  };

  return (
    <>
      <h2>Present Users</h2>
      <ul>
        {presentUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <h2>Text</h2>
      <textarea
        value={text}
        onChange={handleChange}
      />
    </>
  );
};

const AttributionDemo = () => {
  const docID = 'default';
  const wsUrl = 'ws:localhost:1234';
  const userName = useMemo(() => {
    const randomValue = Math.random();
    return `#${Math.floor(randomValue * 0xFFFFFF).toString(16).padStart(6, '0')}`;
  }, []);

  const { text, attributedText, updateText } = useColabValue(docID, wsUrl, userName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value);
  };

  const handleClick = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative min-h-[200px] border rounded-lg p-4 bg-white">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 w-full h-full resize-none cursor-text"
          spellCheck={false}
        />
        <div
          onClick={handleClick}
          className="font-mono whitespace-pre-wrap break-words"
        >
          {attributedText.map((char, index) => (
            <span
              key={index}
              style={{
                color: char.author || 'black',
                transition: 'color 0.3s ease'
              }}
            >
              {char.char || ' '}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [demoType, setDemoType] = useState(true);
  return (
    <div>
      <div className="flex justify-center p-4">
        <button
          className="p-2 bg-blue-500 text-white rounded-lg"
          onClick={() => setDemoType(!demoType)}
        >
          Toggle Demo
        </button>
      </div>
      {demoType ? <AwarenessDemo /> : <AttributionDemo />}
    </div>
  )
};

export default App;