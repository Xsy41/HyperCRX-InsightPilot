/**
 * GitHub platform detection utility
 * Checks if the current page is hosted on GitHub
 */

/** Cached result for better performance */
let cachedResult: boolean | null = null;

/**
 * Check if the current page is hosted on GitHub
 * @returns True if current page is on GitHub, false otherwise
 */
const isGithub = (): boolean => {
  // Return cached result if available
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    // Check if hostname is github.com (supports both http and https)
    const isGithubHost = window.location.hostname === 'github.com';

    // Cache the result for future calls
    cachedResult = isGithubHost;
    return isGithubHost;
  } catch (error) {
    console.error('Error checking if page is GitHub:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Reset the cached result
 * Useful for testing or when navigation occurs
 */
export const resetGithubCache = (): void => {
  cachedResult = null;
};

export default isGithub;
