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
 * Sleep with value options interface
 */
export interface SleepWithValueOptions<T> extends SleepOptions {
  /**
   * Value to resolve with after the delay
   */
  value: T;
}

/**
 * Sleep with error options interface
 */
export interface SleepWithErrorOptions extends SleepOptions {
  /**
   * Error to reject with after the delay
   */
  error: Error;
}

/**
 * Random sleep options interface
 */
export interface SleepRandomOptions extends SleepOptions {
  /**
   * Minimum sleep duration in milliseconds
   */
  min: number;
  /**
   * Maximum sleep duration in milliseconds
   */
  max: number;
}

/**
 * Retry options interface
 */
export interface SleepRetryOptions<T> extends SleepOptions {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;
  /**
   * Initial delay in milliseconds
   */
  delay: number;
  /**
   * Backoff factor for exponential delay (default: 2)
   */
  backoffFactor?: number;
  /**
   * Maximum delay in milliseconds (default: 30000)
   */
  maxDelay?: number;
  /**
   * Function to check if an error should be retried
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
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
 * Promise that resolves with a specified value after a delay
 * @param ms - Number of milliseconds to sleep
 * @param options - Sleep with value options
 * @returns Promise that resolves with the specified value after the delay
 * @throws AbortError if the sleep is canceled via the AbortSignal
 * @example
 * ```typescript
 * // Sleep and return a value
 * const result = await sleepWithValue(1000, { value: 'Hello World' });
 * console.log(result); // 'Hello World'
 * ```
 */
export function sleepWithValue<T>(ms: number, options: SleepWithValueOptions<T>): Promise<T> {
  return sleep(ms, options).then(() => options.value);
}

/**
 * Promise that rejects with a specified error after a delay
 * @param ms - Number of milliseconds to sleep
 * @param options - Sleep with error options
 * @returns Promise that rejects with the specified error after the delay
 * @throws AbortError if the sleep is canceled via the AbortSignal
 * @example
 * ```typescript
 * // Sleep and throw an error
 * try {
 *   await sleepWithError(1000, { error: new Error('Delayed error') });
 * } catch (error) {
 *   console.error(error); // Error: Delayed error
 * }
 * ```
 */
export function sleepWithError(ms: number, options: SleepWithErrorOptions): Promise<never> {
  return sleep(ms, options).then(() => {
    throw options.error;
  });
}

/**
 * Promise that resolves after a random delay between min and max milliseconds
 * @param options - Random sleep options
 * @returns Promise that resolves after a random delay
 * @throws AbortError if the sleep is canceled via the AbortSignal
 * @example
 * ```typescript
 * // Sleep for a random time between 500 and 1500ms
 * await sleepRandom({ min: 500, max: 1500 });
 * ```
 */
export function sleepRandom(options: SleepRandomOptions): Promise<void> {
  const { min, max, ...sleepOptions } = options;

  // Validate input
  if (typeof min !== 'number' || typeof max !== 'number' || min < 0 || max < min) {
    throw new TypeError(`Invalid random sleep parameters: min=${min}, max=${max}. Expected 0 <= min <= max.`);
  }

  // Generate random delay between min and max
  const delay = min + Math.random() * (max - min);
  return sleep(delay, sleepOptions);
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise that resolves with the function result
 * @throws The last error if all attempts fail
 * @example
 * ```typescript
 * // Retry a function with exponential backoff
 * const result = await sleepRetry(async () => {
 *   // Function that might fail
 *   const response = await fetch('https://api.example.com/data');
 *   if (!response.ok) {
 *     throw new Error('Failed to fetch data');
 *   }
 *   return response.json();
 * }, {
 *   maxAttempts: 3,
 *   delay: 1000,
 *   backoffFactor: 2,
 *   maxDelay: 10000
 * });
 * ```
 */
export async function sleepRetry<T>(fn: () => Promise<T>, options: SleepRetryOptions<T>): Promise<T> {
  const {
    maxAttempts,
    delay,
    backoffFactor = 2,
    maxDelay = 30000,
    shouldRetry = () => true,
    ...sleepOptions
  } = options;

  // Validate input
  if (typeof maxAttempts !== 'number' || maxAttempts < 1) {
    throw new TypeError(`Invalid maxAttempts: ${maxAttempts}. Expected at least 1.`);
  }

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < maxAttempts && shouldRetry(lastError, attempt)) {
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = delay * Math.pow(backoffFactor, attempt - 1);
        const jitter = Math.random() * 100;
        const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);

        await sleep(finalDelay, sleepOptions);
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
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
