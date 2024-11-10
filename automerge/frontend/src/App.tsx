import { useState, useEffect, useRef } from 'react'
import CollaborativeTextValue from './attributed-merge-doc'

function App() {
  const [text, setText] = useState('')
  const valueRef = useRef<CollaborativeTextValue | null>(null)

  useEffect(() => {
    // Initialize the collaborative text editor
    const editor = new CollaborativeTextValue("default", "ws:localhost:1234")
    valueRef.current = editor

    // Set initial text
    setText(editor.getText())

    // Listen for updates
    const updateHandler = () => {
      setText(editor.getText())
    };
    editor.ydoc.on('update', updateHandler)

    // Cleanup on unmount
    return () => {
      editor.ydoc.off('update', updateHandler)
      editor.destroy()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newtext = e.target.value
    setText(newtext)
    valueRef.current?.updateTo(newtext, 'local')
  };


  return (
    <div>
      <textarea value={text} onChange={handleChange} />
    </div>
  )
}

export default App
