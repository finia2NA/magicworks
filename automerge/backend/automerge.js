import Automerge from 'automerge';

class CollaborativeDocument {
  constructor() {
    this.doc = Automerge.init(); // Initialize an empty Automerge document
    this.doc = Automerge.change(this.doc, doc => {
      doc.text = []; // Initialize the text array in the document
    });
  }

  // Function to add a character with attribution
  addChar(char, position, user) {
    this.doc = Automerge.change(this.doc, doc => {
      doc.text.insertAt(position, { char, user, timestamp: Date.now() });
    });
  }

  // Function to delete a character at a specific position
  deleteChar(position) {
    this.doc = Automerge.change(this.doc, doc => {
      doc.text.deleteAt(position);
    });
  }

  // Get the document’s current state
  getText() {
    return this.doc.text.map(entry => entry.char).join('');
  }

  // Get character-level attribution
  getAttribution() {
    return this.doc.text.map(entry => ({
      char: entry.char,
      user: entry.user,
      timestamp: entry.timestamp
    }));
  }

  // Merge updates from another document
  mergeChanges(remoteDoc) {
    this.doc = Automerge.merge(this.doc, remoteDoc);
  }

  // Serialize document for storage or transmission
  save() {
    return Automerge.save(this.doc);
  }

  // Load serialized document
  load(serializedDoc) {
    this.doc = Automerge.load(serializedDoc);
  }

  // Apply updates from another user
  applyChanges(changes) {
    this.doc = Automerge.applyChanges(this.doc, changes);
  }
}

// Example usage
const user1Doc = new CollaborativeDocument();
const user2Doc = new CollaborativeDocument();

// User 1 adds some characters with attribution
user1Doc.addChar('H', 0, 'user1');
user1Doc.addChar('i', 1, 'user1');

// User 2 adds more text in a separate instance of the document
user2Doc.addChar('!', 2, 'user2');

// Merge user 2's changes into user 1's document
const changes = Automerge.getAllChanges(user2Doc.doc);
user1Doc.applyChanges(changes);

// Output the merged text and attribution
console.log(user1Doc.getText()); // "Hi!"
console.log(user1Doc.getAttribution());
/*
[
  { char: 'H', user: 'user1', timestamp: <timestamp> },
  { char: 'i', user: 'user1', timestamp: <timestamp> },
  { char: '!', user: 'user2', timestamp: <timestamp> }
]
*/