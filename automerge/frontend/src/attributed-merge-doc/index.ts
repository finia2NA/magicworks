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
 */
class CollaborativeTextValue {
  ydoc: Y.Doc;
  content: Y.Array<TextChunk>;
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
  constructor(docID = "default", websocketUrl?: string) {
    this.ydoc = new Y.Doc();
    this.content = this.ydoc.getArray<TextChunk>(`content-${docID}`);
    this.docName = docID;

    if (websocketUrl) {  
      this.provider = new WebsocketProvider(websocketUrl, docID, this.ydoc, {
        connect: true,
        resyncInterval: 1000,  // Resync every second
      });

      this.setupConnectionHandlers();
    }
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
      try {
        const oldText = this.getText();
        const diffs = diffChars(oldText, newText);

        let currentIndex = 0;
        let accumulatedDeletes = 0;

        // First pass: calculate the ranges to delete
        const deletions: { start: number; length: number; }[] = [];
        for (const diff of diffs) {
          if (diff.removed) {
            deletions.push({ start: currentIndex - accumulatedDeletes, length: diff.value.length });
            accumulatedDeletes += diff.value.length;
          }
          if (!diff.removed && !diff.added) {
            currentIndex += diff.value.length;
          }
        }

        // Apply deletions from end to start to maintain correct indices
        deletions.reverse().forEach(({ start, length }) => {
          this.content.delete(start, length);
        });

        // Second pass: handle additions
        currentIndex = 0;
        for (const diff of diffs) {
          if (diff.added) {
            const chunk: TextChunk = {
              text: diff.value,
              author
            };
            this.content.insert(currentIndex, [chunk]);
            currentIndex += diff.value.length;
          } else if (!diff.removed) {
            currentIndex += diff.value.length;
          }
        }
      } catch (error) {
        console.error('Error during text update:', error);
        throw error;
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

  /**
   * Cleans up and releases resources used by the document.
   */
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    this.ydoc.destroy();
  }
}

export default CollaborativeTextValue;