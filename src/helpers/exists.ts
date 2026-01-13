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
  /** AbortSignal for canceling the wait */
  signal?: AbortSignal;
}

/**
 * Get or create element options
 */
export interface GetOrCreateElementOptions {
  /** Parent element to append the created element to (default: document.body) */
  parent?: HTMLElement;
  /** Attributes to set on the created element */
  attributes?: Record<string, string>;
  /** Text content to set on the created element */
  textContent?: string;
  /** Inner HTML to set on the created element */
  innerHTML?: string;
  /** Styles to set on the created element */
  style?: Partial<CSSStyleDeclaration>;
  /** Classes to add to the created element */
  className?: string;
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
 *
 * // Wait for element with AbortSignal
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 2000);
 * try {
 *   await waitForElement("#my-element", { signal: controller.signal });
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.log('Wait was aborted');
 *   }
 * }
 * ```
 */
export function waitForElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  options: WaitForElementOptions = {}
): Promise<T | null> {
  const { timeout = 5000, interval = 100, throwOnTimeout = true, signal } = options;

  // Check if signal is already aborted
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Wait was canceled', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

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

      timeoutId = setTimeout(checkElement, interval);
    };

    // Set up abort signal listener if provided
    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Wait was canceled', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    // Initial check before starting the polling
    checkElement();
  });
}

/**
 * Wait for multiple DOM elements to exist
 * @param selector CSS selector to wait for
 * @param minCount Minimum number of elements to wait for (default: 1)
 * @param options Optional configuration options
 * @returns Promise that resolves when the minimum number of elements are found
 * @example
 * ```ts
 * // Wait for at least 3 elements with class ".item"
 * const elements = await waitForElements(".item", 3);
 * ```
 */
export function waitForElements<T extends HTMLElement = HTMLElement>(
  selector: string,
  minCount: number = 1,
  options: WaitForElementOptions = {}
): Promise<T[]> {
  const { timeout = 5000, interval = 100, throwOnTimeout = true, signal } = options;

  // Check if signal is already aborted
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Wait was canceled', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

    const checkElements = () => {
      const elements = Array.from(document.querySelectorAll(selector)) as T[];
      if (elements.length >= minCount) {
        resolve(elements);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= timeout) {
        if (throwOnTimeout) {
          reject(
            new Error(
              `Expected at least ${minCount} elements matching "${selector}", but found only ${elements.length} within ${timeout}ms`
            )
          );
        } else {
          resolve(elements);
        }
        return;
      }

      timeoutId = setTimeout(checkElements, interval);
    };

    // Set up abort signal listener if provided
    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Wait was canceled', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    // Initial check before starting the polling
    checkElements();
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
 * @returns The existing or newly created element
 * @example
 * ```ts
 * // Get or create a div element with id "my-container"
 * const container = getOrCreateElement<HTMLDivElement>("#my-container", "div");
 *
 * // Get or create a button element with custom options
 * const button = getOrCreateElement<HTMLButtonElement>("#my-button", "button", {
 *   parent: document.body,
 *   attributes: { type: "button" },
 *   textContent: "Click Me",
 *   className: "btn btn-primary",
 *   style: {
 *     padding: "10px 20px",
 *     fontSize: "16px"
 *   }
 * });
 * ```
 */
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
  const { parent = document.body, attributes, textContent, innerHTML, style, className } = options;

  // Set attributes if provided
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  // Set text content if provided
  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  // Set inner HTML if provided
  if (innerHTML !== undefined) {
    element.innerHTML = innerHTML;
  }

  // Set className if provided
  if (className !== undefined) {
    element.className = className;
  }

  // Set styles if provided
  if (style) {
    Object.entries(style).forEach(([key, value]) => {
      (element.style as any)[key] = value;
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
 * Remove an element from the DOM
 * @param selector Element selector or HTMLElement to remove
 * @returns True if element was removed, false otherwise
 * @example
 * ```ts
 * // Remove element by selector
 * removeElement("#my-element");
 *
 * // Remove an existing element
 * const element = document.getElementById("my-element");
 * removeElement(element);
 * ```
 */
export function removeElement(selector: ElementSelector): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    return true;
  }

  return false;
}

/**
 * Check if an element has a specific class
 * @param element Element selector or HTMLElement to check
 * @param className Class name to check for
 * @returns Boolean indicating if the element has the class
 * @example
 * ```ts
 * // Check if element has class by selector
 * const hasClass = hasClass("#my-element", "active");
 *
 * // Check if existing element has class
 * const element = document.getElementById("my-element");
 * const hasClass = hasClass(element, "active");
 * ```
 */
export function hasClass(selector: ElementSelector, className: string): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  return element !== null && element.classList.contains(className);
}

/**
 * Add a class to an element
 * @param selector Element selector or HTMLElement to add class to
 * @param className Class name to add
 * @returns True if class was added, false otherwise
 * @example
 * ```ts
 * // Add class to element by selector
 * addClass("#my-element", "active");
 *
 * // Add class to existing element
 * const element = document.getElementById("my-element");
 * addClass(element, "active");
 * ```
 */
export function addClass(selector: ElementSelector, className: string): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    element.classList.add(className);
    return true;
  }

  return false;
}

/**
 * Remove a class from an element
 * @param selector Element selector or HTMLElement to remove class from
 * @param className Class name to remove
 * @returns True if class was removed, false otherwise
 * @example
 * ```ts
 * // Remove class from element by selector
 * removeClass("#my-element", "active");
 *
 * // Remove class from existing element
 * const element = document.getElementById("my-element");
 * removeClass(element, "active");
 * ```
 */
export function removeClass(selector: ElementSelector, className: string): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    element.classList.remove(className);
    return true;
  }

  return false;
}

/**
 * Toggle a class on an element
 * @param selector Element selector or HTMLElement to toggle class on
 * @param className Class name to toggle
 * @returns Boolean indicating if the class is now present
 * @example
 * ```ts
 * // Toggle class on element by selector
 * const isActive = toggleClass("#my-element", "active");
 *
 * // Toggle class on existing element
 * const element = document.getElementById("my-element");
 * const isActive = toggleClass(element, "active");
 * ```
 */
export function toggleClass(selector: ElementSelector, className: string): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    return element.classList.toggle(className);
  }

  return false;
}

/**
 * Set CSS style on an element
 * @param selector Element selector or HTMLElement to set style on
 * @param property CSS property name
 * @param value CSS property value
 * @returns True if style was set, false otherwise
 * @example
 * ```ts
 * // Set style on element by selector
 * setStyle("#my-element", "color", "red");
 *
 * // Set style on existing element
 * const element = document.getElementById("my-element");
 * setStyle(element, "color", "red");
 * ```
 */
export function setStyle(selector: ElementSelector, property: keyof CSSStyleDeclaration, value: string): boolean {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    element.style[property] = value;
    return true;
  }

  return false;
}

/**
 * Get CSS style from an element
 * @param selector Element selector or HTMLElement to get style from
 * @param property CSS property name
 * @returns CSS property value or empty string if not found
 * @example
 * ```ts
 * // Get style from element by selector
 * const color = getStyle("#my-element", "color");
 *
 * // Get style from existing element
 * const element = document.getElementById("my-element");
 * const color = getStyle(element, "color");
 * ```
 */
export function getStyle(selector: ElementSelector, property: keyof CSSStyleDeclaration): string {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  return '';
}

/**
 * Scroll to an element smoothly
 * @param selector Element selector or HTMLElement to scroll to
 * @param options Scroll options
 * @example
 * ```ts
 * // Scroll to element by selector
 * scrollToElement("#my-element");
 *
 * // Scroll to existing element with options
 * const element = document.getElementById("my-element");
 * scrollToElement(element, { behavior: "smooth", block: "center" });
 * ```
 */
export function scrollToElement(selector: ElementSelector, options: ScrollIntoViewOptions = {}): void {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options,
    });
  }
}

/**
 * Get parent element of a given element
 * @param selector Element selector or HTMLElement to get parent of
 * @param selector Optional CSS selector to filter parent elements
 * @returns Parent element or null if not found
 * @example
 * ```ts
 * // Get parent of element by selector
 * const parent = getParent("#my-element");
 *
 * // Get parent with specific class
 * const parent = getParent("#my-element", ".container");
 * ```
 */
export function getParent(selector: ElementSelector, parentSelector?: string): HTMLElement | null {
  let element: HTMLElement | null;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (!element) {
    return null;
  }

  let parent = element.parentElement;

  if (parentSelector) {
    while (parent && !parent.matches(parentSelector)) {
      parent = parent.parentElement;
    }
  }

  return parent;
}

/**
 * @deprecated Use checkElementExists instead
 * @zh-CN 检查DOM元素是否存在（已弃用，使用checkElementExists代替）
 * @en-US Check if a DOM element exists (deprecated, use checkElementExists instead)
 */
export default function exists(selector: string): boolean {
  return checkElementExists(selector);
}
