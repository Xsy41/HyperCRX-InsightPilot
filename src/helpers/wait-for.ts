/**
 * Wait for condition utilities
 * @zh-CN 条件等待工具
 */

/**
 * Condition function type for wait utilities
 * @returns boolean or Promise<boolean> indicating whether the condition is met
 */
export type WaitCondition = () => boolean | Promise<boolean>;

/**
 * Result function type that returns a value when condition is met
 * @returns any value or Promise<any> when condition is met
 */
export type WaitResultFunction<T = any> = () => T | Promise<T>;

/**
 * Wait for options interface
 */
export interface WaitForOptions {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 10) */
  interval?: number;
  /** Optional AbortSignal to cancel the waiting process */
  signal?: AbortSignal;
  /** Whether to log errors from condition function (default: true) */
  logErrors?: boolean;
  /** Whether to start polling immediately (default: true) */
  immediate?: boolean;
  /** Custom error message when timeout occurs */
  timeoutMessage?: string;
}

/**
 * Wait for result with timeout info
 */
export interface WaitResult<T = any> {
  /** Result value */
  value: T;
  /** Time spent waiting in milliseconds */
  waitTime: number;
  /** Number of attempts made */
  attempts: number;
}

/**
 * Wait for a condition to become true with optional cancellation support
 * @param condition A function that returns a boolean or Promise<boolean> indicating whether the condition is met
 * @param options Optional configuration options
 * @returns Promise that resolves when condition is met, or rejects if timeout is reached or operation is aborted
 * @example
 * ```ts
 * // Basic usage
 * await waitFor(() => document.body);
 *
 * // With custom timeout and interval
 * await waitFor(
 *   () => document.querySelector('.my-element'),
 *   { timeout: 10000, interval: 100 }
 * );
 *
 * // With cancellation
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 2000);
 * try {
 *   await waitFor(() => false, { signal: controller.signal });
 * } catch (error) {
 *   // Will be called after 2 seconds
 *   console.log('Wait was canceled');
 * }
 * ```
 */
export default async function waitFor(condition: WaitCondition, options: WaitForOptions = {}): Promise<void> {
  // Validate input
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }

  const {
    timeout = 5000,
    interval = 10,
    signal,
    logErrors = true,
    immediate = true,
    timeoutMessage = `waitFor timed out after ${timeout}ms`,
  } = options;

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
  let attempts = 0;

  // Skip immediate check if requested
  if (!immediate) {
    // Check if aborted before first interval
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  while (true) {
    attempts++;

    // Check if condition is met
    try {
      const result = await Promise.resolve(condition());
      if (result) {
        return;
      }
    } catch (error) {
      // If condition throws an error, consider it as not met
      if (logErrors) {
        console.error('waitFor condition threw an error:', error instanceof Error ? error.message : String(error));
      }
    }

    // Check if timeout is reached
    if (Date.now() - startTime >= timeout) {
      const error = new Error(timeoutMessage);
      (error as any).attempts = attempts;
      (error as any).waitTime = Date.now() - startTime;
      throw error;
    }

    // Check if aborted before next interval
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    // Wait for next interval
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for a condition to become true and return a result when it does
 * @param condition A function that returns a boolean or Promise<boolean> indicating whether the condition is met
 * @param resultFn A function that returns the result when condition is met
 * @param options Optional configuration options
 * @returns Promise that resolves with the result when condition is met, or rejects if timeout is reached or operation is aborted
 * @example
 * ```ts
 * // Wait for element and return it
 * const element = await waitForResult(
 *   () => document.querySelector('.my-element') !== null,
 *   () => document.querySelector('.my-element') as HTMLElement
 * );
 *
 * // Wait for API response
 * const data = await waitForResult(
 *   () => api.isReady(),
 *   () => api.fetchData()
 * );
 * ```
 */
export async function waitForResult<T = any>(
  condition: WaitCondition,
  resultFn: WaitResultFunction<T>,
  options: WaitForOptions = {}
): Promise<T> {
  // Validate inputs
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }
  if (typeof resultFn !== 'function') {
    throw new TypeError('Result function must be a function');
  }

  await waitFor(condition, options);
  return resultFn();
}

/**
 * Wait for a condition to become true and return detailed result with timing info
 * @param condition A function that returns a boolean or Promise<boolean> indicating whether the condition is met
 * @param resultFn A function that returns the result when condition is met
 * @param options Optional configuration options
 * @returns Promise that resolves with detailed result when condition is met, or rejects if timeout is reached or operation is aborted
 */
export async function waitForDetailedResult<T = any>(
  condition: WaitCondition,
  resultFn: WaitResultFunction<T>,
  options: WaitForOptions = {}
): Promise<WaitResult<T>> {
  // Validate inputs
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }
  if (typeof resultFn !== 'function') {
    throw new TypeError('Result function must be a function');
  }

  const startTime = Date.now();
  let attempts = 0;

  await waitFor(async () => {
    attempts++;
    return await Promise.resolve(condition());
  }, options);

  const value = await resultFn();
  const waitTime = Date.now() - startTime;

  return {
    value,
    waitTime,
    attempts,
  };
}

/**
 * Wait for a condition to become true and return the condition's return value when it does
 * @param condition A function that returns a truthy value or Promise<truthy> when the condition is met
 * @param options Optional configuration options
 * @returns Promise that resolves with the truthy value when condition is met, or rejects if timeout is reached or operation is aborted
 * @example
 * ```ts
 * // Wait for element and return it directly
 * const element = await waitForTruthy(() => document.querySelector('.my-element'));
 *
 * // Wait for API to return data
 * const data = await waitForTruthy(() => api.getData(), { timeout: 5000 });
 * ```
 */
export async function waitForTruthy<T = any>(
  condition: WaitResultFunction<T>,
  options: WaitForOptions = {}
): Promise<T> {
  // Validate input
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }

  const {
    timeout = 5000,
    interval = 10,
    signal,
    logErrors = true,
    immediate = true,
    timeoutMessage = `waitForTruthy timed out after ${timeout}ms`,
  } = options;

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
  let attempts = 0;

  // Skip immediate check if requested
  if (!immediate) {
    // Check if aborted before first interval
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  while (true) {
    attempts++;

    // Check if condition is met and return the truthy value
    try {
      const result = await Promise.resolve(condition());
      if (result) {
        return result;
      }
    } catch (error) {
      // If condition throws an error, consider it as not met
      if (logErrors) {
        console.error(
          'waitForTruthy condition threw an error:',
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Check if timeout is reached
    if (Date.now() - startTime >= timeout) {
      const error = new Error(timeoutMessage);
      (error as any).attempts = attempts;
      (error as any).waitTime = Date.now() - startTime;
      throw error;
    }

    // Check if aborted before next interval
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    // Wait for next interval
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for an element to appear in the DOM
 * @param selector CSS selector for the element to wait for
 * @param options Optional configuration options
 * @returns Promise that resolves with the found element, or rejects if timeout is reached or operation is aborted
 */
export async function waitForElement(selector: string, options: WaitForOptions = {}): Promise<HTMLElement> {
  if (typeof selector !== 'string' || selector.trim() === '') {
    throw new TypeError('Selector must be a non-empty string');
  }

  return waitForTruthy(() => document.querySelector<HTMLElement>(selector), options);
}

/**
 * Wait for an element to be removed from the DOM
 * @param selector CSS selector for the element to wait for removal
 * @param options Optional configuration options
 * @returns Promise that resolves when element is removed, or rejects if timeout is reached or operation is aborted
 */
export async function waitForElementRemoval(selector: string, options: WaitForOptions = {}): Promise<void> {
  if (typeof selector !== 'string' || selector.trim() === '') {
    throw new TypeError('Selector must be a non-empty string');
  }

  await waitFor(() => !document.querySelector(selector), options);
}

/**
 * Wait for multiple elements to appear in the DOM
 * @param selector CSS selector for the elements to wait for
 * @param minCount Minimum number of elements to wait for (default: 1)
 * @param options Optional configuration options
 * @returns Promise that resolves with the found elements, or rejects if timeout is reached or operation is aborted
 */
export async function waitForElements(
  selector: string,
  minCount: number = 1,
  options: WaitForOptions = {}
): Promise<HTMLElement[]> {
  if (typeof selector !== 'string' || selector.trim() === '') {
    throw new TypeError('Selector must be a non-empty string');
  }
  if (typeof minCount !== 'number' || minCount < 1) {
    throw new TypeError('minCount must be a positive number');
  }

  return waitForTruthy(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return elements.length >= minCount ? elements : null;
  }, options);
}

/**
 * Wait for a specific amount of time
 * @param ms Time to wait in milliseconds
 * @param signal Optional AbortSignal to cancel the wait
 * @returns Promise that resolves after the specified time, or rejects if operation is aborted
 */
export async function waitForTimeout(ms: number, signal?: AbortSignal): Promise<void> {
  if (typeof ms !== 'number' || ms < 0) {
    throw new TypeError('ms must be a non-negative number');
  }

  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    // Cleanup if aborted
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Operation aborted', 'AbortError'));
    });
  });
}

/**
 * Wait for a specific amount of time and return a value
 * @param ms Time to wait in milliseconds
 * @param value Value to return after the wait
 * @param signal Optional AbortSignal to cancel the wait
 * @returns Promise that resolves with the provided value after the specified time, or rejects if operation is aborted
 */
export async function waitForTimeoutWithValue<T = any>(ms: number, value: T, signal?: AbortSignal): Promise<T> {
  await waitForTimeout(ms, signal);
  return value;
}

/**
 * Create a cancelable wait function with a pre-configured AbortController
 * @returns Object with wait functions and cancel method
 * @example
 * ```ts
 * const { waitFor: cancelableWaitFor, cancel } = createCancelableWait();
 *
 * // Start waiting with cancellation support
 * cancelableWaitFor(() => false)
 *   .then(() => console.log('Wait completed'))
 *   .catch(() => console.log('Wait was canceled'));
 *
 * // Cancel after 1 second
 * setTimeout(() => cancel(), 1000);
 * ```
 */
export function createCancelableWait() {
  let controller: AbortController | null = null;

  const cancelableWaitFor = (condition: WaitCondition, options: Omit<WaitForOptions, 'signal'> = {}) => {
    // Cancel any existing wait
    if (controller) {
      controller.abort();
    }

    // Create new controller for this wait
    controller = new AbortController();

    return waitFor(condition, { ...options, signal: controller.signal });
  };

  const cancelableWaitForResult = <T = any>(
    condition: WaitCondition,
    resultFn: WaitResultFunction<T>,
    options: Omit<WaitForOptions, 'signal'> = {}
  ) => {
    // Cancel any existing wait
    if (controller) {
      controller.abort();
    }

    // Create new controller for this wait
    controller = new AbortController();

    return waitForResult(condition, resultFn, { ...options, signal: controller.signal });
  };

  const cancelableWaitForDetailedResult = <T = any>(
    condition: WaitCondition,
    resultFn: WaitResultFunction<T>,
    options: Omit<WaitForOptions, 'signal'> = {}
  ) => {
    // Cancel any existing wait
    if (controller) {
      controller.abort();
    }

    // Create new controller for this wait
    controller = new AbortController();

    return waitForDetailedResult(condition, resultFn, { ...options, signal: controller.signal });
  };

  const cancelableWaitForTruthy = <T = any>(
    condition: WaitResultFunction<T>,
    options: Omit<WaitForOptions, 'signal'> = {}
  ) => {
    // Cancel any existing wait
    if (controller) {
      controller.abort();
    }

    // Create new controller for this wait
    controller = new AbortController();

    return waitForTruthy(condition, { ...options, signal: controller.signal });
  };

  const cancelableWaitForElement = (selector: string, options: Omit<WaitForOptions, 'signal'> = {}) => {
    // Cancel any existing wait
    if (controller) {
      controller.abort();
    }

    // Create new controller for this wait
    controller = new AbortController();

    return waitForElement(selector, { ...options, signal: controller.signal });
  };

  const cancel = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return {
    waitFor: cancelableWaitFor,
    waitForResult: cancelableWaitForResult,
    waitForDetailedResult: cancelableWaitForDetailedResult,
    waitForTruthy: cancelableWaitForTruthy,
    waitForElement: cancelableWaitForElement,
    cancel,
  };
}

/**
 * Create a wait function with default options
 * @param defaultOptions Default options to use for all wait operations
 * @returns Object with wait functions that use the default options
 */
export function createWaitWithDefaults(defaultOptions: WaitForOptions) {
  return {
    waitFor: (condition: WaitCondition, options: WaitForOptions = {}) =>
      waitFor(condition, { ...defaultOptions, ...options }),

    waitForResult: <T = any>(condition: WaitCondition, resultFn: WaitResultFunction<T>, options: WaitForOptions = {}) =>
      waitForResult(condition, resultFn, { ...defaultOptions, ...options }),

    waitForDetailedResult: <T = any>(
      condition: WaitCondition,
      resultFn: WaitResultFunction<T>,
      options: WaitForOptions = {}
    ) => waitForDetailedResult(condition, resultFn, { ...defaultOptions, ...options }),

    waitForTruthy: <T = any>(condition: WaitResultFunction<T>, options: WaitForOptions = {}) =>
      waitForTruthy(condition, { ...defaultOptions, ...options }),

    waitForElement: (selector: string, options: WaitForOptions = {}) =>
      waitForElement(selector, { ...defaultOptions, ...options }),

    waitForElementRemoval: (selector: string, options: WaitForOptions = {}) =>
      waitForElementRemoval(selector, { ...defaultOptions, ...options }),

    waitForElements: (selector: string, minCount: number = 1, options: WaitForOptions = {}) =>
      waitForElements(selector, minCount, { ...defaultOptions, ...options }),
  };
}
