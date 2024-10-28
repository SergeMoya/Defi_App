// backend/src_backend/utils/RequestQueue.ts

class RequestQueue {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private interval: number;
  
    constructor(interval: number = 2000) { // Default 2 second interval between requests
      this.interval = interval;
    }
  
    async add<T>(task: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
  
        if (!this.processing) {
          this.processQueue();
        }
      });
    }
  
    private async processQueue() {
      if (this.processing || this.queue.length === 0) {
        return;
      }
  
      this.processing = true;
  
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (task) {
          try {
            await task();
          } catch (error) {
            console.error('Error processing queue task:', error);
          }
          // Wait for the specified interval before processing the next request
          await new Promise(resolve => setTimeout(resolve, this.interval));
        }
      }
  
      this.processing = false;
    }
  
    clear() {
      this.queue = [];
      this.processing = false;
    }
  
    get length() {
      return this.queue.length;
    }
  
    get isProcessing() {
      return this.processing;
    }
  }
  
  export const globalRequestQueue = new RequestQueue();
  export default RequestQueue;