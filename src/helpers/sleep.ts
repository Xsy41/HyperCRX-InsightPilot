/**
 * Utility functions for delaying execution
 * @zh-CN 延迟执行的实用函数
 */

/**
 * Sleep options interface
 */
export interface SleepOptions {
  /**
   * AbortSignal for canceling the sleep
   */
  signal?: AbortSignal;
}

/**
 * Promise that resolves after a specified number of milliseconds
 * @param ms - Number of milliseconds to sleep
 * @param options - Sleep options
 * @returns Promise that resolves after the specified delay
 * @throws AbortError if the sleep is canceled via the AbortSignal
 * @example
 * ```typescript
 * // Basic usage
 * await sleep(1000); // Sleep for 1 second
 *
 * // With cancellation
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 500);
 * try {
 *   await sleep(1000, { signal: controller.signal });
 * } catch (error) {
 *   if (error instanceof Error && error.name === 'AbortError') {
 *     console.log('Sleep was canceled');
 *   }
 * }
 * ```
 */
export function sleep(ms: number, options: SleepOptions = {}): Promise<void> {
  // Validate input
  if (typeof ms !== 'number' || ms < 0) {
    throw new TypeError(`Invalid sleep duration: ${ms}. Expected a non-negative number.`);
  }

  // Return immediately if duration is 0
  if (ms === 0) {
    return Promise.resolve();
  }

  // Check if signal is already aborted
  if (options.signal?.aborted) {
    return Promise.reject(new DOMException('Sleep was canceled', 'AbortError'));
  }

  return new Promise<void>((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      // Clean up signal listener if not already done
      options.signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, ms);

    // Set up abort signal listener if provided
    if (options.signal) {
      const handleAbort = () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Sleep was canceled', 'AbortError'));
      };

      options.signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}

/**
 * Create a cancelable sleep function with a pre-configured AbortController
 * @returns Object with sleep function and cancel method
 * @example
 * ```typescript
 * const { sleep: cancelableSleep, cancel } = createCancelableSleep();
 *
 * // Start a long sleep
 * cancelableSleep(10000).then(() => console.log('Sleep completed'));
 *
 * // Cancel after 1 second
 * setTimeout(() => {
 *   cancel();
 *   console.log('Sleep canceled');
 * }, 1000);
 * ```
 */
export function createCancelableSleep() {
  let controller: AbortController | null = null;

  const cancelableSleep = (ms: number): Promise<void> => {
    // Cancel any existing sleep
    if (controller) {
      controller.abort();
    }

    // Create new controller for this sleep
    controller = new AbortController();

    return sleep(ms, { signal: controller.signal });
  };

  const cancel = (): void => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return {
    sleep: cancelableSleep,
    cancel,
  };
}

// Export as default for backward compatibility
export default sleep;
