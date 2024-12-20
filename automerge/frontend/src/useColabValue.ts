import { useState, useEffect, useRef } from 'react';
import CollaborativeTextValue from './colabValue';

function useColabValue(docID: string, wsUrl: string, userID: string) {
  // State to manage the document's text and the list of present users
  const [text, setText] = useState('');
  const [presentUsers, setPresentUsers] = useState<string[]>([]);
  const [attributedText, setAttributedText] = useState<{ char: string; author: string; }[]>([]);
  const valueRef = useRef<CollaborativeTextValue | null>(null);

  // Initialize the collaborative document and set up event listeners
  useEffect(() => {
    const colabValue = new CollaborativeTextValue(docID, wsUrl, userID);
    valueRef.current = colabValue;

    // Initial state setup
    setText(colabValue.getText());
    setAttributedText(colabValue.getTextWithAttribution());
    setPresentUsers(colabValue.getPresentUsers() || []);

    // Handlers for updates
    const handleTextUpdate = () => {
      setText(colabValue.getText());
      setAttributedText(colabValue.getTextWithAttribution());
    };

    const handleAwarenessUpdate = () => {
      const presentUsers = colabValue.getPresentUsers();
      if (presentUsers) setPresentUsers(presentUsers);
    };

    // Attach event listeners
    colabValue.ydoc.on('update', handleTextUpdate);
    if (colabValue.awareness) {
      colabValue.awareness.on('update', handleAwarenessUpdate);
    }

    // Cleanup on unmount
    return () => {
      colabValue.ydoc.off('update', handleTextUpdate);
      if (colabValue.awareness) {
        colabValue.awareness.off('update', handleAwarenessUpdate);
      }
      colabValue.destroy();
    };
  }, [docID, wsUrl, userID]);

  // Update the collaborative document when text changes
  const updateText = async (newText: string) => {
    setText(newText);
    try {
      await valueRef.current?.updateTo(newText, userID);
    } catch (error) {
      console.error('Failed to update text:', error);
    }
  };

  // Undo the last change
  const undo = () => {
    valueRef.current?.undo();
    setText(valueRef.current?.getText() || '');
    setAttributedText(valueRef.current?.getTextWithAttribution() || []);
  };

  // Redo the last undone change
  const redo = () => {
    valueRef.current?.redo();
    setText(valueRef.current?.getText() || '');
    setAttributedText(valueRef.current?.getTextWithAttribution() || []);
  };

  // Return the current state and the update/undo/redo functions
  return {
    text,
    attributedText,
    presentUsers,
    updateText,
    undo,
    redo,
  };
}

export default useColabValue;