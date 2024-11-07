import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

class CollaborativeTextEditor {
  ydoc: Y.Doc;
  root: Y.XmlElement<{ [key: string]: string; }>;
  docName = "default";
  provider?: WebsocketProvider;

  constructor(docName = "default", websocketUrl?: string) {
    // Initialize the Yjs document and root XML element
    this.ydoc = new Y.Doc();
    this.root = this.ydoc.getXmlElement(`y-${docName}`);
    if (!this.root) {
      this.root = new Y.XmlElement();
      this.ydoc.getMap().set(`y-${docName}`, this.root);
    }

    // Connect to the WebSocket server for document sync
    if (websocketUrl) {
      this.provider = new WebsocketProvider(websocketUrl, docName, this.ydoc);
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

  // Method to retrieve text with attribution
  getTextWithAttribution() {
    const result: { char: any; author: any; }[] = [];
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
  getText() {
    return this.root.toArray().reduce((acc, node) => {
      if (node instanceof Y.XmlText) {
        acc += node.toString();
      }
      return acc;
    });
  }

  // Optionally, you can destroy the provider when no longer needed
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
  }
}

export default CollaborativeTextEditor;