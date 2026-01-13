/**
 * Wait for a condition to become true
 * @param condition A function that returns a boolean indicating whether the condition is met
 * @param options Optional configuration options
 * @param options.timeout Maximum time to wait in milliseconds (default: 5000)
 * @param options.interval Polling interval in milliseconds (default: 10)
 * @returns Promise that resolves when condition is met, or rejects if timeout is reached
 */
export default async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<void> {
  // Validate input
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }

  const { timeout = 5000, interval = 10 } = options;

  // Validate options
  if (typeof timeout !== 'number' || timeout < 0) {
    throw new TypeError('Timeout must be a non-negative number');
  }
  if (typeof interval !== 'number' || interval <= 0) {
    throw new TypeError('Interval must be a positive number');
  }

  const startTime = Date.now();

  while (true) {
    // Check if condition is met
    try {
      const result = await Promise.resolve(condition());
      if (result) {
        return;
      }
    } catch (error) {
      // If condition throws an error, consider it as not met
      console.error('waitFor condition threw an error:', error);
    }

    // Check if timeout is reached
    if (Date.now() - startTime >= timeout) {
      throw new Error(`waitFor timed out after ${timeout}ms`);
    }

    // Wait for next interval
    // eslint-disable-next-line no-await-in-loop
    await delay(interval);
  }
}
