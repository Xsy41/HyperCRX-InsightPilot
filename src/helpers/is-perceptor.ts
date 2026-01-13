/**
 * Perceptor redirect detection utilities
 * @zh-CN Perceptor重定向检测工具
 */

/**
 * Cache the result to avoid repeated checks
 */
let cachedResult: boolean | null = null;

/**
 * Check if the current page is a perceptor redirect
 * @returns True if the page URL contains redirect=perceptor query parameter
 * @example
 * ```ts
 * // Check if current page is a perceptor redirect
 * const isPerceptorPage = isPerceptor();
 * 
 * // Usage in a component
 * if (isPerceptor()) {
 *   // Render perceptor-specific content
 * }
 * ```
 */
export const isPerceptor = (): boolean => {
  // Return cached result if available
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    // Use URLSearchParams for reliable query parameter parsing
    const urlParams = new URLSearchParams(window.location.search);
    const isPerceptorRedirect = urlParams.get('redirect') === 'perceptor';

    // Cache the result
    cachedResult = isPerceptorRedirect;

    return isPerceptorRedirect;
  } catch (error) {
    console.error('Error checking if page is perceptor redirect:', error instanceof Error ? error.message : String(error));
    // Cache the error result to avoid repeated errors
    cachedResult = false;
    return false;
  }
};

/**
 * Check if a given URL is a perceptor redirect
 * @param url The URL to check
 * @returns True if the URL contains redirect=perceptor query parameter
 * @example
 * ```ts
 * // Check if a specific URL is a perceptor redirect
 * const isPerceptorUrl = isPerceptorUrl('https://example.com?redirect=perceptor');
 * ```
 */
export const isPerceptorUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const urlParams = new URLSearchParams(urlObj.search);
    return urlParams.get('redirect') === 'perceptor';
  } catch (error) {
    console.error('Error checking if URL is perceptor redirect:', error instanceof Error ? error.message : String(error));
    return false;
  }
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
  cachedResult = null;
};

// Default export for backward compatibility
export default isPerceptor;
