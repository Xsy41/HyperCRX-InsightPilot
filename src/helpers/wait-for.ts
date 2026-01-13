/**
 * Wait for a condition to become true with optional cancellation support
 * @param condition A function that returns a boolean or Promise<boolean> indicating whether the condition is met
 * @param options Optional configuration options
 * @param options.timeout Maximum time to wait in milliseconds (default: 5000)
 * @param options.interval Polling interval in milliseconds (default: 10)
 * @param options.signal Optional AbortSignal to cancel the waiting process
 * @returns Promise that resolves when condition is met, or rejects if timeout is reached or operation is aborted
 */
export interface WaitForOptions {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 10) */
  interval?: number;
  /** Optional AbortSignal to cancel the waiting process */
  signal?: AbortSignal;
}

/**
 * Wait for a condition to become true with optional cancellation support
 * @param condition A function that returns a boolean or Promise<boolean> indicating whether the condition is met
 * @param options Optional configuration options
 * @returns Promise that resolves when condition is met, or rejects if timeout is reached or operation is aborted
 */
export default async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: WaitForOptions = {}
): Promise<void> {
  // Validate input
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }

  const { timeout = 5000, interval = 10, signal } = options;

  // Validate options
  if (typeof timeout !== 'number' || timeout < 0) {
    throw new TypeError('Timeout must be a non-negative number');
  }
  if (typeof interval !== 'number' || interval <= 0) {
    throw new TypeError('Interval must be a positive number');
  }

  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  const startTime = Date.now();

  // Internal delay function
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (true) {
    // Check if condition is met
    try {
      const result = await Promise.resolve(condition());
      if (result) {
        return;
      }
    } catch (error) {
      // If condition throws an error, consider it as not met
      console.error('waitFor condition threw an error:', error instanceof Error ? error.message : String(error));
    }

    // Check if timeout is reached
    if (Date.now() - startTime >= timeout) {
      throw new Error(`waitFor timed out after ${timeout}ms`);
    }

    // Check if aborted before next interval
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    // Wait for next interval
    // eslint-disable-next-line no-await-in-loop
    await delay(interval);
  }
}
