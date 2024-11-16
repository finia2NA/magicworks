import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { diffChars } from 'diff';

interface TextChunk {
  text: string;
  author: string;
}

/**
 * Represents a collaborative text editor that supports real-time synchronization and text attribution.
 * Uses Yjs for CRDT-based document synchronization and WebSocket for network communication.
 * 
 * @class
 * @example
 * ```typescript
 * const editor = new CollaborativeTextValue('docId', 'ws://server.com');
 * await editor.updateTo('new text', 'author1');
 * const text = editor.getText();
 * const attribution = editor.getTextWithAttribution();
 * ```
 * 
 * @property {Y.Doc} ydoc - The Yjs document instance managing the shared data structure
 * @property {Y.Array<TextChunk>} content - The array containing text chunks with attribution
 * @property {string} docName - The name/identifier of the document
 * @property {WebsocketProvider} [provider] - Optional WebSocket provider for network synchronization
 * 
 * @throws {Error} When text update operations fail
 * @throws {Error} When network connection cannot be established after max retries
 * 
 * Features:
 * - Real-time collaborative editing
 * - Character-level attribution tracking
 * - Automatic conflict resolution
 * - Built-in offline support via Yjs CRDT
 * - Undo/redo functionality
 */
class CollaborativeTextValue {
  ydoc: Y.Doc;
  awareness;
  content: Y.Array<TextChunk>;
  undoManager: Y.UndoManager;
  docName = "default";
  provider?: WebsocketProvider;
  private origin = 'update-origin-' + Math.random();
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 4;

  /**
   * Creates a new instance of the document.
   * @param docID - The unique identifier for the document. Defaults to "default".
   * @param websocketUrl - Optional URL for WebSocket connection. If provided, establishes a real-time collaboration connection.
   * @constructor
   */
  constructor(docID = "default", websocketUrl?: string, userID?: string) {
    this.ydoc = new Y.Doc();
    this.content = this.ydoc.getArray<TextChunk>(`content-${docID}`);
    this.undoManager = new Y.UndoManager(this.content, {
      trackedOrigins: new Set([this.origin]),
    });
    this.docName = docID;

    // early return if no websocket url is provided
    if (!websocketUrl) return;

    this.provider = new WebsocketProvider(websocketUrl, docID, this.ydoc, {
      connect: true,
      resyncInterval: 1000,  // Resync every second
    });

    this.setupConnectionHandlers();

    // Early return if no user ID is provided
    if (!userID) return;

    this.awareness = this.provider.awareness
    this.awareness.setLocalStateField('user', {
      name: userID,
    });
  }

  /**
   * Sets up event handlers for the WebSocket connection provider.
   * @private
   */
  private setupConnectionHandlers() {
    if (!this.provider) return;

    this.provider.on('status', ({ status }: { status: string }) => {
      console.log('Connection status:', status);
      if (status === 'connected') {
        this.retryCount = 0;
      }
    });

    this.provider.on('sync', (isSynced: boolean) => {
      console.log('Sync status:', isSynced);
    });

    this.provider?.ws?.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      this.handleConnectionError();
    });
  }

  /**
   * Handles connection errors with exponential backoff retry mechanism.
   * @private
   * @async
   */
  private async handleConnectionError() {
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      const delay = Math.min(500 * Math.pow(2, this.retryCount), 10000);
      console.log(`Retrying connection in ${delay}ms... (Attempt ${this.retryCount})`);

      await new Promise(resolve => setTimeout(resolve, delay));

      if (this.provider) {
        this.provider.connect();
      }
    } else {
      console.error('Max retry attempts reached');
    }
  }

  /**
   * Updates the document's content with new text while preserving authorship information.
   * Uses a diff-based approach to identify changes and applies them atomically within a transaction.
   * 
   * @param newText - The new text content to update the document to
   * @param author - The identifier of the author making the changes
   */
  async updateTo(newText: string, author: string): Promise<void> {
    this.ydoc.transact(() => {
      const oldText = this.getText();
      const diffs = diffChars(oldText, newText, { oneChangePerToken: true });

      console.log('Diffs:', diffs);

      let index = 0;
      for (const diff of diffs) {
        if (!diff.added && !diff.removed) {
          index += diff.value.length;
        }
        if (diff.removed && !diff.added) {
          for (let i = 0; i < diff.value.length; i++) {
            this.content.delete(index);
          }
        }
        if (diff.added && !diff.removed) {
          for (const char of diff.value) {
            this.content.insert(index, [{ text: char, author }]);
            index++;
          }
        }
        if (diff.added && diff.removed) {
          for (let i = 0; i < diff.value.length; i++) {
            this.content.delete(index);
            this.content.insert(index, [{ text: diff.value, author }]);
            index++;
          }
        }
      }


    }, this.origin);
  }

  /**
   * Retrieves the text content by concatenating all text chunks.
   * @returns {string} The concatenated text content
   */
  getText(): string {
    try {
      return this.content.toArray().reduce((acc, chunk) => acc + chunk.text, '');
    } catch (error) {
      console.error('Error getting text:', error);
      return '';
    }
  }

  /**
   * Retrieves the text content along with its author attribution.
   * @returns An array of objects containing character and author information
   */
  getTextWithAttribution() {
    try {
      const result: { char: string; author: string; }[] = [];
      this.content.toArray().forEach((chunk) => {
        for (const char of chunk.text) {
          result.push({ char, author: chunk.author });
        }
      });
      return result;
    } catch (error) {
      console.error('Error getting attributed text:', error);
      return [];
    }
  }

  getPresentUsers() {
    const states = this.awareness?.getStates();
    if (!states) return null;

    const users: string[] = Array.from(states.keys()).map((key) => {
      return states.get(key)?.user.name;
    });

    return users;
  }

  /**
   * Undo the last change.
   */
  undo() {
    this.undoManager.undo();
  }

  /**
   * Redo the last undone change.
   */
  redo() {
    this.undoManager.redo();
  }

  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    this.undoManager.destroy(); // Clean up the undo manager
    this.ydoc.destroy();
  }
}

export default CollaborativeTextValue;