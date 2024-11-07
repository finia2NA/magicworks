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

  test('insertion should work at the specified index', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('a', 'user1');
    editor.addCharacter('c', 'user1');
    editor.addCharacter('b', 'user2', 1); // delayed b

    const documentText = editor.getTextWithAttribution();

    expect(documentText).toEqual([
      { char: 'a', author: 'user1' },
      { char: 'b', author: 'user2' },
      { char: 'c', author: 'user1' },
    ])
  });

  test('changeCharacter should change the character at the specified index', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('H', 'user1');
    editor.addCharacter('e', 'user1');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('l', 'user2');

    editor.changeCharacter('p', "user3", 3);

    const updatedDocumentText = editor.getTextWithAttribution();
    expect(updatedDocumentText).toEqual([
      { char: 'H', author: 'user1' },
      { char: 'e', author: 'user1' },
      { char: 'l', author: 'user2' },
      { char: 'p', author: 'user3' },
    ]);
  });

  test('wip diffing', () => {
    const editor = new CollaborativeTextEditor();
    editor.addCharacter('H', 'user1');
    editor.addCharacter('e', 'user1');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('l', 'user2');
    editor.addCharacter('o', 'user1');

    editor.updateTo('Helsinki', "user3");

    const updatedDocumentText = editor.getTextWithAttribution();
    expect(updatedDocumentText).toEqual([
      { char: 'H', author: 'user1' },
      { char: 'e', author: 'user1' },
      { char: 'l', author: 'user2' },
      { char: 's', author: 'user3' },
      { char: 'i', author: 'user3' },
      { char: 'n', author: 'user3' },
      { char: 'k', author: 'user3' },
      { char: 'i', author: 'user3' },
    ]);


  });

});