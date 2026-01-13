/**
 * Gitee platform detection utility
 * @zh-CN Gitee平台检测工具
 */

/** Cached result for better performance */
let cachedResult: boolean | null = null;

/**
 * Check if the current page is hosted on Gitee
 * @returns True if current page is on Gitee, false otherwise
 * @example
 * ```ts
 * // Check if current page is on Gitee
 * if (isGitee()) {
 *   // Render Gitee-specific content
 * }
 * ```
 */
export const isGitee = (): boolean => {
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
 * Check if a given URL is hosted on Gitee
 * @param url The URL to check
 * @returns True if the URL is on Gitee, false otherwise
 * @example
 * ```ts
 * // Check if a specific URL is on Gitee
 * const isGiteeUrl = isGiteeUrl('https://gitee.com/hypertrons/hypertrons-crx'); // true
 * const isGiteeUrl = isGiteeUrl('https://github.com'); // false
 * ```
 */
export const isGiteeUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'gitee.com';
  } catch (error) {
    console.error('Error checking if URL is Gitee:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Reset the cached result
 * Useful for testing or when navigation occurs
 * @example
 * ```ts
 * // Reset cache after navigation
 * window.addEventListener('popstate', () => {
 *   resetGiteeCache();
 * });
 * ```
 */
export const resetGiteeCache = (): void => {
  cachedResult = null;
};

/**
 * Gitee hostname constant for easy reference
 */
export const GITEE_HOSTNAME = 'gitee.com';

/**
 * Gitee domains pattern for more comprehensive detection
 */
export const GITEE_DOMAINS = [GITEE_HOSTNAME, 'www.gitee.com'];

/**
 * Check if the current page is on any Gitee domain (including www subdomain)
 * @returns True if current page is on any Gitee domain, false otherwise
 * @example
 * ```ts
 * // Check if current page is on any Gitee domain
 * if (isAnyGiteeDomain()) {
 *   // Render Gitee-specific content
 * }
 * ```
 */
export const isAnyGiteeDomain = (): boolean => {
  try {
    const hostname = window.location.hostname;
    return GITEE_DOMAINS.includes(hostname);
  } catch (error) {
    console.error(
      'Error checking if page is on any Gitee domain:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

export default isGitee;
