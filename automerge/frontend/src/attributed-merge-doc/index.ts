import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { diffChars } from 'diff';

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
 * @property {Y.XmlElement} root - The root XML element containing the document content
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
  root: Y.XmlElement<{ [key: string]: string; }>;
  docName = "default";
  provider?: WebsocketProvider;
  private origin = 'update-origin-' + Math.random();
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;

  /**
   * Creates a new instance of the document.
   * @param docID - The unique identifier for the document. Defaults to "default".
   * @param websocketUrl - Optional URL for WebSocket connection. If provided, establishes a real-time collaboration connection.
   * @constructor
   * 
   * @remarks
   * - Initializes a new Y.Doc instance
   * - Creates or retrieves an XML element with the specified docID
   * - If websocketUrl is provided, establishes WebSocket connection with auto-resync every second
   */
  constructor(docID = "default", websocketUrl?: string) {
    this.ydoc = new Y.Doc();
    this.root = this.ydoc.getXmlElement(`y-${docID}`);
    if (!this.root) {
      this.root = new Y.XmlElement();
      this.ydoc.getMap().set(`y-${docID}`, this.root);
    }

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
   * Manages connection status, synchronization, and error handling.
   * 
   * Handles the following events:
   * - 'status': Monitors connection status changes
   * - 'sync': Monitors document synchronization status
   * - 'error': Handles WebSocket connection errors with exponential backoff
   * 
   * @private
   * @returns {void}
   * @throws {Error} If connection error occurs during WebSocket communication
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

    // Listen for connection errors
    this.provider?.ws?.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      this.handleConnectionError();
    });
  }

  /**
   * Handles connection errors by implementing an exponential backoff retry mechanism.
   * If the connection fails, it will attempt to reconnect multiple times with increasing delays.
   * 
   * The delay between retries follows an exponential pattern (2^retryCount seconds),
   * capped at 10 seconds maximum delay between attempts.
   * 
   * @private
   * @async
   * @throws {Error} When maximum retry attempts are reached
   */
  private async handleConnectionError() {
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000); // Exponential backoff
      console.log(`Retrying connection in ${delay}ms... (Attempt ${this.retryCount})`);

      await new Promise(resolve => setTimeout(resolve, delay));

      if (this.provider) {
        this.provider.connect();
      }
    } else {
      console.error('Max retry attempts reached');
      // You might want to notify the user here
    }
  }

  /**
   * Updates the document's content with new text while preserving authorship information.
   * Uses a diff-based approach to identify changes and applies them atomically within a transaction.
   * 
   * @param newText - The new text content to update the document to
   * @param author - The identifier of the author making the changes
   * 
   * @throws {Error} If the text update operation fails
   * 
   * @remarks
   * The update process:
   * 1. Calculates character-level diffs between old and new text
   * 2. Processes removals and additions sequentially
   * 3. Maintains proper indexing accounting for previous deletions
   * 4. Associates added text with author attribution
   * 
   * All changes are executed within a transaction to ensure atomicity.
   */
  async updateTo(newText: string, author: string): Promise<void> {
    this.ydoc.transact(() => {
      try {
        const oldText = this.getText();
        const diffs = diffChars(oldText, newText);

        let currentIndex = 0;
        let deleteOffset = 0;

        for (const diff of diffs) {
          if (!diff.added && !diff.removed) {
            currentIndex += diff.value.length;
            continue;
          }

          if (diff.removed) {
            const deleteLength = diff.value.length;
            const adjustedIndex = currentIndex - deleteOffset;
            this.root.delete(adjustedIndex, deleteLength);
            deleteOffset += deleteLength;
          }

          if (diff.added) {
            const adjustedIndex = currentIndex - deleteOffset;
            const textNode = new Y.XmlText();
            textNode.insert(0, diff.value);
            textNode.setAttribute('author', author);
            this.root.insert(adjustedIndex, [textNode]);
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
   * Retrieves the text content from the root node by concatenating all XML text nodes.
   * 
   * This method traverses the root node's array and combines all XmlText nodes into a single string.
   * If any error occurs during the process, it returns an empty string and logs the error.
   * 
   * @returns {string} The concatenated text content from all XML text nodes, or an empty string if an error occurs
   * 
   * @throws {Error} Logs any error that occurs during text extraction to the console
   */
  getText(): string {
    try {
      return this.root.toArray().reduce((acc, node) => {
        if (node instanceof Y.XmlText) {
          acc += node.toString();
        }
        return acc;
      }, '');
    } catch (error) {
      console.error('Error getting text:', error);
      return '';
    }
  }

  /**
   * Retrieves the text content along with its author attribution.
   * Each character in the text is paired with its corresponding author.
   * 
   * @returns An array of objects, where each object contains:
   *          - char: A single character from the text
   *          - author: The author attribution for that character
   * 
   * @throws {Error} Logs error to console and returns empty array if text extraction fails
   */
  getTextWithAttribution() {
    try {
      const result: { char: string; author: string; }[] = [];
      this.root.toArray().forEach((node) => {
        if (node instanceof Y.XmlText) {
          const author = node.getAttribute('author');
          const text = node.toString();
          for (const char of text) {
            result.push({ char, author });
          }
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
   * This method should be called when the document is no longer needed.
   * It will destroy both the provider (if it exists) and the underlying Y.js document.
   */
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    this.ydoc.destroy();
  }
}

export default CollaborativeTextValue;