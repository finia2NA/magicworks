import * as Y from 'yjs';

class CollaborativeTextEditor {
  ydoc: Y.Doc;
  root: Y.XmlElement<{ [key: string]: string; }>;
  constructor(docName = "default") {
    // Initialize the Yjs document and root XML element
    this.ydoc = new Y.Doc();
    this.root = this.ydoc.getXmlElement(`y-${docName}}`);
    if (!this.root) {
      this.root = new Y.XmlElement();
      this.ydoc.getMap().set(`y-${docName}}`, this.root);
    }
  }

  // Method to add a character with attribution
  addCharacter(char: string, author: string) {
    if (char.length !== 1) {
      throw new Error('Only single characters are allowed for now');
    }
    const charNode = new Y.XmlText();
    charNode.insert(0, char); // Insert the character
    charNode.setAttribute('author', author); // Set the author attribute
    this.root.push([charNode]); // Add character node to the root element
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

  getText() {
    return this.root.toArray().reduce((acc, node) => {
      if (node instanceof Y.XmlText) {
        acc += node.toString();
      }
      return acc;
    });
  }
}

export default CollaborativeTextEditor