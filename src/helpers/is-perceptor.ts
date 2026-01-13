/**
 * Perceptor redirect detection utilities
 * @zh-CN Perceptor重定向检测工具
 */

/**
 * Perceptor detection options
 */
export interface PerceptorDetectionOptions {
  /**
   * Whether to check for perceptor in pathname (default: true)
   */
  checkPath?: boolean;
  /**
   * Whether to check for perceptor in query parameters (default: true)
   */
  checkQuery?: boolean;
  /**
   * Whether to cache the result (default: true)
   */
  cache?: boolean;
}

/**
 * Perceptor state change listener type
 */
export type PerceptorStateChangeListener = (isPerceptor: boolean, url: string) => void;

/**
 * Cache the result to avoid repeated checks
 */
let cachedResult: boolean | null = null;

/**
 * Perceptor state change listeners
 */
let perceptorListeners: Set<PerceptorStateChangeListener> = new Set();

/**
 * Default detection options
 */
const defaultDetectionOptions: PerceptorDetectionOptions = {
  checkPath: true,
  checkQuery: true,
  cache: true,
};

/**
 * Check if the current page is a perceptor redirect
 * @param options Detection options
 * @returns True if the page is a perceptor redirect
 * @example
 * ```ts
 * // Check if current page is a perceptor redirect
 * const isPerceptorPage = isPerceptor();
 *
 * // Usage in a component
 * if (isPerceptor()) {
 *   // Render perceptor-specific content
 * }
 *
 * // With custom options
 * const isPerceptorPage = isPerceptor({ checkPath: true, checkQuery: false });
 * ```
 */
export const isPerceptor = (options: PerceptorDetectionOptions = {}): boolean => {
  // Merge with default options
  const opts = { ...defaultDetectionOptions, ...options };

  // Return cached result if available and caching is enabled
  if (opts.cache && cachedResult !== null) {
    return cachedResult;
  }

  try {
    const result = detectPerceptor(window.location.href, opts);

    // Cache the result if caching is enabled
    if (opts.cache) {
      cachedResult = result;
    }

    return result;
  } catch (error) {
    console.error(
      'Error checking if page is perceptor redirect:',
      error instanceof Error ? error.message : String(error)
    );

    // Cache the error result to avoid repeated errors if caching is enabled
    if (opts.cache) {
      cachedResult = false;
    }
    return false;
  }
};

/**
 * Internal function to detect perceptor in a URL
 * @param url The URL to check
 * @param options Detection options
 * @returns True if the URL is a perceptor redirect
 */
function detectPerceptor(url: string, options: PerceptorDetectionOptions): boolean {
  try {
    const urlObj = new URL(url);
    let isPerceptorDetected = false;

    // Check query parameters if enabled
    if (options.checkQuery) {
      const urlParams = new URLSearchParams(urlObj.search);
      isPerceptorDetected = urlParams.get('redirect') === 'perceptor';
    }

    // Check pathname if enabled and perceptor not already detected
    if (!isPerceptorDetected && options.checkPath) {
      // Check if path contains perceptor-related patterns
      const path = urlObj.pathname.toLowerCase();
      isPerceptorDetected = path.includes('/perceptor/') || path.endsWith('/perceptor');
    }

    return isPerceptorDetected;
  } catch (error) {
    console.error('Error detecting perceptor in URL:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if a given URL is a perceptor redirect
 * @param url The URL to check
 * @param options Detection options
 * @returns True if the URL is a perceptor redirect
 * @example
 * ```ts
 * // Check if a specific URL is a perceptor redirect
 * const isPerceptorUrl = isPerceptorUrl('https://example.com?redirect=perceptor');
 *
 * // With custom options
 * const isPerceptorUrl = isPerceptorUrl('https://example.com/perceptor', { checkPath: true, checkQuery: false });
 * ```
 */
export const isPerceptorUrl = (url: string, options: PerceptorDetectionOptions = {}): boolean => {
  // Merge with default options, but disable caching for URL-specific checks
  const opts = { ...defaultDetectionOptions, ...options, cache: false };

  return detectPerceptor(url, opts);
};

/**
 * Reset the cached result, useful for testing or dynamic URL changes
 * @example
 * ```ts
 * // Reset the cache after URL changes
 * window.history.pushState({}, '', '/new-url');
 * resetPerceptorCache();
 * ```
 */
export const resetPerceptorCache = (): void => {
  const oldResult = cachedResult;
  cachedResult = null;

  // If result changed, notify listeners
  const newResult = isPerceptor({ cache: false });
  if (oldResult !== newResult) {
    notifyListeners(newResult, window.location.href);
  }
};

/**
 * Extract perceptor-related parameters from a URL
 * @param url Optional URL to extract parameters from (defaults to current URL)
 * @returns Object containing perceptor-related parameters
 * @example
 * ```ts
 * // Extract perceptor parameters from current URL
 * const params = getPerceptorParams();
 *
 * // Extract from specific URL
 * const params = getPerceptorParams('https://example.com?redirect=perceptor&foo=bar');
 * // Returns: { redirect: 'perceptor', foo: 'bar' }
 * ```
 */
export const getPerceptorParams = (url: string = window.location.href): Record<string, string> => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const result: Record<string, string> = {};

    // Extract all query parameters
    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  } catch (error) {
    console.error('Error extracting perceptor parameters:', error instanceof Error ? error.message : String(error));
    return {};
  }
};

/**
 * Add a listener for perceptor state changes
 * @param listener The listener function to add
 * @returns A function to remove the listener
 * @example
 * ```ts
 * // Add a perceptor state change listener
 * const removeListener = addPerceptorStateChangeListener((isPerceptor, url) => {
 *   console.log(`Perceptor state changed: ${isPerceptor} for URL: ${url}`);
 * });
 *
 * // Remove the listener when no longer needed
 * removeListener();
 * ```
 */
export const addPerceptorStateChangeListener = (listener: PerceptorStateChangeListener): (() => void) => {
  perceptorListeners.add(listener);

  // Return a function to remove the listener
  return () => {
    removePerceptorStateChangeListener(listener);
  };
};

/**
 * Remove a listener for perceptor state changes
 * @param listener The listener function to remove
 * @example
 * ```ts
 * const myListener = (isPerceptor, url) => {
 *   console.log(`Perceptor state: ${isPerceptor} at ${url}`);
 * };
 *
 * addPerceptorStateChangeListener(myListener);
 * // ... later
 * removePerceptorStateChangeListener(myListener);
 * ```
 */
export const removePerceptorStateChangeListener = (listener: PerceptorStateChangeListener): void => {
  perceptorListeners.delete(listener);
};

/**
 * Notify all listeners of perceptor state changes
 * @param isPerceptor Current perceptor state
 * @param url Current URL
 */
function notifyListeners(isPerceptor: boolean, url: string): void {
  perceptorListeners.forEach((listener) => {
    try {
      listener(isPerceptor, url);
    } catch (error) {
      console.error('Error in perceptor state listener:', error instanceof Error ? error.message : String(error));
    }
  });
}

/**
 * Watch for URL changes and automatically update perceptor state
 * @returns A function to stop watching for URL changes
 * @example
 * ```ts
 * // Start watching for URL changes
 * const stopWatching = watchPerceptorState();
 *
 * // Stop watching when no longer needed
 * stopWatching();
 * ```
 */
export const watchPerceptorState = (): (() => void) => {
  // Track current URL
  let currentUrl = window.location.href;

  // Handle URL changes
  const handleUrlChange = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      // Reset cache and notify listeners if state changed
      resetPerceptorCache();
    }
  };

  // Add event listeners for URL changes
  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('pushstate', handleUrlChange);
  window.addEventListener('replacestate', handleUrlChange);

  // Return function to remove event listeners
  return () => {
    window.removeEventListener('popstate', handleUrlChange);
    window.removeEventListener('pushstate', handleUrlChange);
    window.removeEventListener('replacestate', handleUrlChange);
  };
};

// Default export for backward compatibility
export default isPerceptor;
