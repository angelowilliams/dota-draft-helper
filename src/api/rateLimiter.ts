/**
 * Rate limiter for STRATZ API
 * Limits: 20 requests/second, 250 requests/minute
 * Uses a queue with minimum spacing between requests
 */

const REQUESTS_PER_SECOND = 15; // Conservative limit (actual: 20)
const REQUESTS_PER_MINUTE = 200; // Conservative limit (actual: 250)
const MIN_REQUEST_GAP_MS = 80; // Minimum 80ms between requests (~12/sec max)
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = 60 * 1000;

class RateLimiter {
  private requestTimestamps: number[] = [];
  private lastRequestTime = 0;
  private queue: Array<() => void> = [];
  private processing = false;

  /**
   * Wait if necessary to respect rate limits, then record the request.
   * Uses a queue to ensure concurrent calls are properly serialized.
   */
  async throttle(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      this.cleanOldTimestamps(now);

      // Calculate all wait times
      const gapWait = this.calculateGapWait(now);
      const rateWait = this.calculateRateWait(now);
      const waitTime = Math.max(gapWait, rateWait);

      if (waitTime > 0) {
        await this.delay(waitTime);
        continue; // Recalculate after waiting
      }

      // Record this request and resolve the next queued promise
      const currentTime = Date.now();
      this.requestTimestamps.push(currentTime);
      this.lastRequestTime = currentTime;

      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
    }

    this.processing = false;
  }

  private calculateGapWait(now: number): number {
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_GAP_MS) {
      return MIN_REQUEST_GAP_MS - timeSinceLastRequest;
    }
    return 0;
  }

  private calculateRateWait(now: number): number {
    const oneSecondAgo = now - ONE_SECOND_MS;

    // Count requests in the last second
    const requestsLastSecond = this.requestTimestamps.filter(ts => ts > oneSecondAgo).length;

    // Count requests in the last minute (already cleaned to only have last minute)
    const requestsLastMinute = this.requestTimestamps.length;

    // Check per-second limit
    if (requestsLastSecond >= REQUESTS_PER_SECOND) {
      const oldestInSecond = this.requestTimestamps.find(ts => ts > oneSecondAgo);
      if (oldestInSecond) {
        return oldestInSecond + ONE_SECOND_MS - now + 50;
      }
    }

    // Check per-minute limit
    if (requestsLastMinute >= REQUESTS_PER_MINUTE) {
      const oldestInMinute = this.requestTimestamps[0];
      if (oldestInMinute) {
        return oldestInMinute + ONE_MINUTE_MS - now + 50;
      }
    }

    return 0;
  }

  private cleanOldTimestamps(now: number): void {
    const oneMinuteAgo = now - ONE_MINUTE_MS;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status for debugging/display
   */
  getStatus(): { requestsLastSecond: number; requestsLastMinute: number; queueLength: number } {
    const now = Date.now();
    this.cleanOldTimestamps(now);

    const oneSecondAgo = now - ONE_SECOND_MS;
    const requestsLastSecond = this.requestTimestamps.filter(ts => ts > oneSecondAgo).length;

    return {
      requestsLastSecond,
      requestsLastMinute: this.requestTimestamps.length,
      queueLength: this.queue.length,
    };
  }
}

// Singleton instance for the app
export const stratzRateLimiter = new RateLimiter();
