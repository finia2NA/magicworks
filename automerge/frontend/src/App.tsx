import { useState, useEffect, useRef, useMemo } from 'react';
import CollaborativeTextValue from './attributed-merge-doc';

// Simple demo of syncing text.
const SimpleDemo = () => {
  // Configurable options
  const docID = 'defaultDoc';
  const userID = 'defaultUser';
  const wsUrl = 'ws:localhost:1234';

  // state where we store what is displayed in the textarea, and the reference to the yjs shared text objectF
  const [text, setText] = useState('');
  const valueRef = useRef<CollaborativeTextValue | null>(null);

  // Set up the syncing. Create a new Syncing object, which takes the docID and the URL of the server.
  useEffect(() => {
    const editor = new CollaborativeTextValue(docID, wsUrl);
    valueRef.current = editor;

    // set the text to the current text in the shared object
    setText(editor.getText());

    // When the ydoc changes, update the text state. This will re-render the textarea with the new text.
    const updateHandler = () => {
      setText(editor.getText());
    };

    editor.ydoc.on('update', updateHandler);

    // Cleanup on unmount
    return () => {
      editor.ydoc.off('update', updateHandler);
      editor.destroy();
    };
  }, []);

  // When the user types, we update the yjs doc to the new text.
  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newtext = e.target.value;
    setText(newtext);
    try {
      await valueRef.current?.updateTo(newtext, userID);
    } catch (error) {
      console.error('Failed to update text:', error);
    }
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
    />
  );
}

// More complex demo, showing attributed text with different colors.
const ComplexDemo = () => {
  const [text, setText] = useState('');
  const [attributedText, setAttributedText] = useState<{ char: string; author: string; }[]>([]);
  const valueRef = useRef<CollaborativeTextValue | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // username is set to color (this is not how it is done in real applications)
  const userName = useMemo(() => {
    const randomValue = Math.random();
    const hexString = `#${Math.floor(randomValue * 0xFFFFFF).toString(16).padStart(6, '0')}`;
    return hexString;
  }, []);

  useEffect(() => {
    const editor = new CollaborativeTextValue("default", "ws:localhost:1234");
    valueRef.current = editor;

    setText(editor.getText());
    setAttributedText(editor.getTextWithAttribution());

    const updateHandler = () => {
      setText(editor.getText());
      setAttributedText(editor.getTextWithAttribution());
    };

    editor.ydoc.on('update', updateHandler);

    return () => {
      editor.ydoc.off('update', updateHandler);
      editor.destroy();
    };
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newtext = e.target.value;
    setText(newtext);
    try {
      await valueRef.current?.updateTo(newtext, userName);
    } catch (error) {
      console.error('Failed to update text:', error);
    }
  };

  const handleClick = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative min-h-[200px] border rounded-lg p-4 bg-white">
        {/* Hidden textarea for input handling */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 w-full h-full resize-none cursor-text"
          spellCheck={false}
        />

        {/* Visible text display */}
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
          {/* Show cursor position with a blinking caret */}
          <span className="animate-pulse">|</span>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  const [isSimpleDemo, setIsSimpleDemo] = useState(false);
  return (
    <div>
      <div className="flex justify-center p-4">
        <button
          className="p-2 bg-blue-500 text-white rounded-lg"
          onClick={() => setIsSimpleDemo(!isSimpleDemo)}
        >
          Toggle Demo
        </button>
      </div>
      {isSimpleDemo ? <SimpleDemo /> : <ComplexDemo />}
    </div>
  )
};

export default App;