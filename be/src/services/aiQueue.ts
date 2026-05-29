type QueueTask = () => Promise<void>;

class AIQueue {
  private queue: QueueTask[] = [];
  private isProcessing = false;

  public add(task: QueueTask) {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const task = this.queue.shift();
    
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("[AIQueue] Error processing task:", error);
      }
    }
    
    // Add a 1000ms delay between AI calls to respect rate limits
    setTimeout(() => {
      this.processNext();
    }, 1000);
  }
}

export const aiQueue = new AIQueue();
