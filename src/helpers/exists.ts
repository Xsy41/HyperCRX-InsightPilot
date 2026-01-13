/**
 * DOM element existence utilities
 * @zh-CN DOM元素存在性工具
 */

/**
 * Check if a DOM element exists
 * @param selector CSS selector string or HTMLElement to check
 * @returns Boolean indicating if the element exists
 * @example
 * ```ts
 * // Check if element with id "my-element" exists
 * const exists = checkElementExists("#my-element");
 * 
 * // Check if an existing element exists
 * const element = document.getElementById("my-element");
 * const exists = checkElementExists(element);
 * ```
 */
export function checkElementExists(selector: string | HTMLElement): boolean {
  if (typeof selector === 'string') {
    return document.querySelector(selector) !== null;
  }
  return selector instanceof HTMLElement;
}

/**
 * Wait for a DOM element to exist
 * @param selector CSS selector to wait for
 * @param options Optional configuration options
 * @param options.timeout Maximum time to wait in milliseconds (default: 5000)
 * @param options.interval Polling interval in milliseconds (default: 100)
 * @returns Promise that resolves when the element is found, or rejects if timeout is reached
 * @example
 * ```ts
 * // Wait for element to exist with default timeout
 * await waitForElement("#my-element");
 * 
 * // Wait for element to exist with custom timeout and interval
 * await waitForElement("#my-element", { timeout: 10000, interval: 200 });
 * ```
 */
export interface WaitForElementOptions {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 100) */
  interval?: number;
}

export function waitForElement(
  selector: string,
  options: WaitForElementOptions = {}
): Promise<HTMLElement> {
  const { timeout = 5000, interval = 100 } = options;
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        return;
      }
      
      setTimeout(checkElement, interval);
    };
    
    checkElement();
  });
}

/**
 * Get the first element that matches a selector, or null if it doesn't exist
 * @param selector CSS selector string
 * @returns First matching element or null
 * @example
 * ```ts
 * const element = getElement("#my-element");
 * if (element) {
 *   // Element exists, do something with it
 * }
 * ```
 */
export function getElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

/**
 * Get all elements that match a selector
 * @param selector CSS selector string
 * @returns Array of matching elements
 * @example
 * ```ts
 * const elements = getElements(".my-class");
 * elements.forEach(element => {
 *   // Do something with each element
 * });
 * ```
 */
export function getElements<T extends HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll(selector)) as T[];
}

/**
 * @deprecated Use checkElementExists instead
 * @zh-CN 检查DOM元素是否存在（已弃用，使用checkElementExists代替）
 * @en-US Check if a DOM element exists (deprecated, use checkElementExists instead)
 */
export default function exists(selector: string): boolean {
  return checkElementExists(selector);
}
