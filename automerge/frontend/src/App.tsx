import { useState, useEffect, useRef, useMemo } from 'react';
import CollaborativeTextValue from './attributed-merge-doc';

const App = () => {
  const [text, setText] = useState('');
  const [attributedText, setAttributedText] = useState<{ char: string; author: string; }[]>([]);
  const valueRef = useRef<CollaborativeTextValue | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
};

export default App;