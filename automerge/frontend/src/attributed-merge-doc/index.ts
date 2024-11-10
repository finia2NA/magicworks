import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { diffChars } from 'diff';

class CollaborativeTextValue {
  ydoc: Y.Doc;
  root: Y.XmlElement<{ [key: string]: string; }>;
  docName = "default";
  provider?: WebsocketProvider;

  constructor(docID = "default", websocketUrl?: string) {
    this.ydoc = new Y.Doc();
    this.root = this.ydoc.getXmlElement(`y-${docID}`);
    if (!this.root) {
      this.root = new Y.XmlElement();
      this.ydoc.getMap().set(`y-${docID}`, this.root);
    }

    if (websocketUrl) {
      this.provider = new WebsocketProvider(websocketUrl, docID, this.ydoc, { connect: true });
    }
  }

  updateTo(newText: string, author: string) {
    // Start a transaction to batch all updates
    this.ydoc.transact(() => {
      const oldText = this.getText();
      const diffs = diffChars(oldText, newText);

      // Calculate the absolute positions for each diff
      let currentIndex = 0;
      let deleteOffset = 0;

      for (const diff of diffs) {
        if (!diff.added && !diff.removed) {
          currentIndex += diff.value.length;
          continue;
        }

        if (diff.removed) {
          // Handle deletion
          const deleteLength = diff.value.length;
          const adjustedIndex = currentIndex - deleteOffset;
          this.root.delete(adjustedIndex, deleteLength);
          deleteOffset += deleteLength;
        }

        if (diff.added) {
          // Handle addition by creating a single XML text node for the entire added segment
          const adjustedIndex = currentIndex - deleteOffset;
          const textNode = new Y.XmlText();
          textNode.insert(0, diff.value);
          textNode.setAttribute('author', author);
          this.root.insert(adjustedIndex, [textNode]);
          currentIndex += diff.value.length;
        }
      }
    });
  }

  // Method to add a character with attribution
  addCharacter(char: string, author: string, index?: number) {
    const textNode = new Y.XmlText();
    textNode.insert(0, char);
    textNode.setAttribute('author', author);

    if (typeof index === 'undefined') {
      this.root.push([textNode]);
    } else {
      this.root.insert(index, [textNode]);
    }
  }

  // Method to remove a character at a given index
  removeCharacter(index: number) {
    this.root.delete(index, 1);
  }

  // Method to retrieve text with attribution
  getTextWithAttribution() {
    const result: { char: string; author: string; }[] = [];
    this.root.toArray().forEach((node) => {
      if (node instanceof Y.XmlText) {
        const author = node.getAttribute('author');
        const text = node.toString();
        // Split the text into characters but maintain the same author
        for (const char of text) {
          result.push({ char, author });
        }
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

  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
  }
}

export default CollaborativeTextValue;