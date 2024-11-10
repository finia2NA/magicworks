import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { diffChars } from 'diff';

class CollaborativeTextEditor {
  ydoc: Y.Doc;
  root: Y.XmlElement<{ [key: string]: string; }>;
  docName = "default";
  provider?: WebsocketProvider;

  constructor(docID = "default", websocketUrl?: string) {
    // Initialize the Yjs document and root XML element
    this.ydoc = new Y.Doc();
    this.root = this.ydoc.getXmlElement(`y-${docID}`);
    if (!this.root) {
      this.root = new Y.XmlElement();
      this.ydoc.getMap().set(`y-${docID}`, this.root);
    }

    // Connect to the WebSocket server for document sync
    if (websocketUrl) {
      this.provider = new WebsocketProvider(websocketUrl, docID, this.ydoc);
    }
  }

  updateTo(newText: string, author: string) {
    // Find the difference between the texts, what needs to be deleted and added
    const oldText = this.getText();
    const diffs = diffChars(oldText, newText);
    console.log(diffs);

    // go left-to-right through the indices where something needs to be modified, and apply the changes
    // for this, keep track of index shift due to deletions and insertions
    let index = 0;
    for (const diff of diffs) {
      // skip case
      if (!diff.added && !diff.removed) {
        index += diff.value.length;
      }
      // deletion case
      if (diff.removed && !diff.added) {
        for (let i = 0; i < diff.value.length; i++) {
          this.removeCharacter(index);
        }
      }

      // insertion case
      if (diff.added && !diff.removed) {
        for (const char of diff.value) {
          this.addCharacter(char, author, index);
          index++;
        }
      }

      // modification case
      if (diff.added && diff.removed) {
        console.log("modification case!");
        for (let i = 0; i < diff.value.length; i++) {
          this.changeCharacter(diff.value, author, index);
          index++;
        }
      }
    }
  }

  // Method to add a character with attribution
  addCharacter(char: string, author: string, index?: number) {
    if (char.length !== 1) {
      throw new Error('Only single characters are allowed for now');
    }
    const charNode = new Y.XmlText();
    charNode.insert(0, char); // Insert the character
    charNode.setAttribute('author', author); // Set the author attribute
    if (!index) {
      this.root.push([charNode]); // Add character node to the root element
    } else {
      this.root.insert(index, [charNode]); // Add character node to the root element
    }
  }

  // Method to remove a character at a given index
  removeCharacter(index: number) {
    this.root.delete(index, 1);
  }

  changeCharacter(char: string, author: string, index: number) {
    if (char.length !== 1) {
      throw new Error('Only single characters are allowed for now');
    }
    const charNode = this.root.get(index);
    if (charNode instanceof Y.XmlText) {
      charNode.delete(0, 1);
      charNode.insert(0, char);
      charNode.setAttribute('author', author);
    }
  }

  // Method to retrieve text with attribution
  getTextWithAttribution() {
    const result: { char: string; author: string; }[] = [];
    this.root.toArray().forEach((node) => {
      if (node instanceof Y.XmlText) {
        const author = node.getAttribute('author');
        const char = node.toString();
        result.push({ char, author });
      }
    });
    return result;
  }

  // Method to get plain text without attribution
  getText(): string {
    return this.root.toArray().reduce((acc, node) => {
      if (node instanceof Y.XmlText) {
        acc += node.toString();
      }
      return acc;
    }, '');
  }

  // Optionally, you can destroy the provider when no longer needed
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
  }
}

export default CollaborativeTextEditor;