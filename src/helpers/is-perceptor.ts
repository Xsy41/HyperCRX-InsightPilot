/**
 * Check if the current page is a perceptor redirect
 * @returns True if the page is a perceptor redirect, false otherwise
 */

// Cache the result to avoid repeated checks
let cachedResult: boolean | null = null;

/**
 * Check if the current page is a perceptor redirect
 * @returns True if the page URL contains redirect=perceptor query parameter
 */
const isPerceptor = (): boolean => {
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
    console.error('Error checking if page is perceptor redirect:', error);
    // Cache the error result to avoid repeated errors
    cachedResult = false;
    return false;
  }
};

/**
 * Reset the cached result, useful for testing or dynamic URL changes
 */
export const resetPerceptorCache = (): void => {
  cachedResult = null;
};

export default isPerceptor;
