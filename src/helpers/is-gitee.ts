/**
 * Gitee platform detection utility
 * Checks if the current page is hosted on Gitee
 */

/** Cached result for better performance */
let cachedResult: boolean | null = null;

/**
 * Check if the current page is hosted on Gitee
 * @returns True if current page is on Gitee, false otherwise
 */
const isGitee = (): boolean => {
  // Return cached result if available
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    // Check if hostname is gitee.com (supports both http and https)
    const isGiteeHost = window.location.hostname === 'gitee.com';

    // Cache the result for future calls
    cachedResult = isGiteeHost;
    return isGiteeHost;
  } catch (error) {
    console.error('Error checking if page is Gitee:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Reset the cached result
 * Useful for testing or when navigation occurs
 */
export const resetGiteeCache = (): void => {
  cachedResult = null;
};

export default isGitee;
