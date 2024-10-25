import { sleep } from './helpers';

export class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 50) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = oldestTimestamp + this.windowMs - now;
      if (waitTime > 0) {
        await sleep(waitTime);
      }
      this.timestamps = this.timestamps.slice(1);
    }

    this.timestamps.push(now);
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let retries = 0;
    let delay = initialDelay;

    while (true) {
      try {
        await this.throttle();
        return await fn();
      } catch (error: any) {
        if (
          retries >= maxRetries ||
          (error?.response?.status !== 429 && error?.response?.status !== 503)
        ) {
          throw error;
        }

        retries++;
        // Exponential backoff with jitter
        delay = Math.min(delay * 2 + Math.random() * 1000, 30000);
        
        if (error?.response?.headers['retry-after']) {
          const retryAfter = parseInt(error.response.headers['retry-after']) * 1000;
          delay = Math.max(delay, retryAfter);
        }

        console.log(`Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${retries})`);
        await sleep(delay);
      }
    }
  }
}

export const globalRateLimiter = new RateLimiter();