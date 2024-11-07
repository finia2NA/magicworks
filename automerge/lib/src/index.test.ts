// CollaborativeTextEditor.test.js
import CollaborativeTextEditor from './index';

describe('CollaborativeTextEditor', () => {

  test('addCharacter should add characters with attribution correctly', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('H', 'user1');
    editor.addCharacter('e', 'user1');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('o', 'user1');

    const documentText = editor.getTextWithAttribution();
    expect(documentText).toEqual([
      { char: 'H', author: 'user1' },
      { char: 'e', author: 'user1' },
      { char: 'l', author: 'user2' },
      { char: 'l', author: 'user2' },
      { char: 'o', author: 'user1' },
    ]);
  });

  test('removeCharacter should remove a character at the specified index', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('H', 'user1');
    editor.addCharacter('e', 'user1');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('o', 'user1');

    // Remove the character at index 4
    editor.removeCharacter(4);

    const updatedDocumentText = editor.getTextWithAttribution();
    expect(updatedDocumentText).toEqual([
      { char: 'H', author: 'user1' },
      { char: 'e', author: 'user1' },
      { char: 'l', author: 'user2' },
      { char: 'l', author: 'user2' },
      // "o" was removed
    ]);
  });

  test('getText should return the text without attribution', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('H', 'user1');
    editor.addCharacter('e', 'user1');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('o', 'user1');

    const documentText = editor.getText();
    expect(documentText).toBe('Hello');
  });
});