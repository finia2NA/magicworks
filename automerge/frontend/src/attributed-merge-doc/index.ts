import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { diffChars } from 'diff';


class CollaborativeTextValue {
  ydoc: Y.Doc;
  root: Y.XmlElement<{ [key: string]: string; }>;
  docName = "default";
  provider?: WebsocketProvider;
  private isConnected: boolean = false;
  private updateQueue: Array<() => void> = [];
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;

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

  private setupConnectionHandlers() {
    if (!this.provider) return;

    this.provider.on('status', ({ status }: { status: string }) => {
      console.log('Connection status:', status);

      if (status === 'connected') {
        this.isConnected = true;
        this.retryCount = 0;
        this.processUpdateQueue();
      } else {
        this.isConnected = false;
      }
    });

    this.provider.on('sync', (isSynced: boolean) => {
      console.log('Sync status:', isSynced);
      if (isSynced) {
        this.processUpdateQueue();
      }
    });

    // Listen for connection errors
    this.provider?.ws?.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      this.handleConnectionError();
    });
  }

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

  private processUpdateQueue() {
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        update();
      }
    }
  }

  private queueUpdate(updateFn: () => void) {
    return new Promise<void>((resolve, reject) => {
      const wrappedUpdate = () => {
        try {
          updateFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      if (this.isConnected) {
        wrappedUpdate();
      } else {
        this.updateQueue.push(wrappedUpdate);
      }
    });
  }

  async updateTo(newText: string, author: string): Promise<void> {
    const updateFn = () => {
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
          throw error; // Re-throw to be caught by the queue processor
        }
      }, this.origin);
    };

    return this.queueUpdate(updateFn);
  }

  private origin = 'update-origin-' + Math.random();

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

  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    this.ydoc.destroy();
  }
}

export default CollaborativeTextValue;