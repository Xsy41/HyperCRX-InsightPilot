/**
 * DOM element existence and manipulation utilities
 * @zh-CN DOM元素存在性和操作工具
 */

/**
 * Element selector type that can be either a CSS selector string or an actual HTMLElement
 */
export type ElementSelector = string | HTMLElement;

/**
 * Wait for element options
 */
export interface WaitForElementOptions {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 100) */
  interval?: number;
  /** Whether to throw an error on timeout (default: true) */
  throwOnTimeout?: boolean;
}

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
export function checkElementExists(selector: ElementSelector): boolean {
  if (typeof selector === 'string') {
    return document.querySelector(selector) !== null;
  }
  return selector instanceof HTMLElement;
}

/**
 * Wait for a DOM element to exist
 * @param selector CSS selector to wait for
 * @param options Optional configuration options
 * @returns Promise that resolves when the element is found, or rejects if timeout is reached and throwOnTimeout is true
 * @example
 * ```ts
 * // Wait for element to exist with default timeout
 * await waitForElement("#my-element");
 *
 * // Wait for element to exist with custom timeout and interval
 * await waitForElement("#my-element", { timeout: 10000, interval: 200 });
 *
 * // Wait for element without throwing on timeout
 * const element = await waitForElement("#my-element", { throwOnTimeout: false });
 * if (element) {
 *   // Element was found
 * }
 * ```
 */
export function waitForElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  options: WaitForElementOptions = {}
): Promise<T | null> {
  const { timeout = 5000, interval = 100, throwOnTimeout = true } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.querySelector(selector) as T | null;
      if (element instanceof HTMLElement) {
        resolve(element);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= timeout) {
        if (throwOnTimeout) {
          reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        } else {
          resolve(null);
        }
        return;
      }

      setTimeout(checkElement, interval);
    };

    // Initial check before starting the polling
    checkElement();
  });
}

/**
 * Get the first element that matches a selector, or null if it doesn't exist
 * @param selector CSS selector string
 * @returns First matching element or null
 * @example
 * ```ts
 * const element = getElement<HTMLDivElement>("#my-element");
 * if (element) {
 *   // Element exists, do something with it
 *   element.textContent = "Hello World";
 * }
 * ```
 */
export function getElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

/**
 * Get all elements that match a selector
 * @param selector CSS selector string
 * @returns Array of matching elements
 * @example
 * ```ts
 * const elements = getElements<HTMLButtonElement>(".my-button");
 * elements.forEach(button => {
 *   button.addEventListener("click", () => {
 *     console.log("Button clicked");
 *   });
 * });
 * ```
 */
export function getElements<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll(selector)) as T[];
}

/**
 * Get or create an element
 * @param selector CSS selector to find the element
 * @param tagName Tag name to create if the element doesn't exist
 * @param options Optional creation options
 * @param options.parent Parent element to append the created element to (default: document.body)
 * @returns The existing or newly created element
 * @example
 * ```ts
 * // Get or create a div element with id "my-container"
 * const container = getOrCreateElement<HTMLDivElement>("#my-container", "div");
 *
 * // Get or create a button element with custom parent
 * const parent = document.getElementById("parent");
 * const button = getOrCreateElement<HTMLButtonElement>("#my-button", "button", { parent });
 * ```
 */
export interface GetOrCreateElementOptions {
  /** Parent element to append the created element to (default: document.body) */
  parent?: HTMLElement;
  /** Attributes to set on the created element */
  attributes?: Record<string, string>;
}

export function getOrCreateElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  tagName: keyof HTMLElementTagNameMap,
  options: GetOrCreateElementOptions = {}
): T {
  const existingElement = getElement<T>(selector);
  if (existingElement) {
    return existingElement;
  }

  const element = document.createElement(tagName) as T;
  const { parent = document.body, attributes } = options;

  // Set attributes if provided
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  parent.appendChild(element);
  return element;
}

/**
 * Check if an element matches a CSS selector
 * @param element The element to check
 * @param selector CSS selector to match against
 * @returns Boolean indicating if the element matches the selector
 * @example
 * ```ts
 * const element = document.getElementById("my-element");
 * if (element && matchesSelector(element, ".my-class")) {
 *   // Element matches the selector
 * }
 * ```
 */
export function matchesSelector(element: HTMLElement, selector: string): boolean {
  return element.matches(selector);
}

/**
 * @deprecated Use checkElementExists instead
 * @zh-CN 检查DOM元素是否存在（已弃用，使用checkElementExists代替）
 * @en-US Check if a DOM element exists (deprecated, use checkElementExists instead)
 */
export default function exists(selector: string): boolean {
  return checkElementExists(selector);
}
