/**
 * GitHub platform detection utility
 * @zh-CN GitHub平台检测工具
 */

/** Cached result for better performance */
let cachedResult: boolean | null = null;

/**
 * Check if the current page is hosted on GitHub
 * @returns True if current page is on GitHub, false otherwise
 * @example
 * ```ts
 * // Check if current page is on GitHub
 * if (isGithub()) {
 *   // Render GitHub-specific content
 * }
 * ```
 */
export const isGithub = (): boolean => {
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
 * Check if a given URL is hosted on GitHub
 * @param url The URL to check
 * @returns True if the URL is on GitHub, false otherwise
 * @example
 * ```ts
 * // Check if a specific URL is on GitHub
 * const isGithubUrl = isGithubUrl('https://github.com/hypertrons/hypertrons-crx'); // true
 * const isGithubUrl = isGithubUrl('https://gitee.com'); // false
 * ```
 */
export const isGithubUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com';
  } catch (error) {
    console.error('Error checking if URL is GitHub:', error instanceof Error ? error.message : String(error));
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
 *   resetGithubCache();
 * });
 * ```
 */
export const resetGithubCache = (): void => {
  cachedResult = null;
};

/**
 * GitHub hostname constant for easy reference
 */
export const GITHUB_HOSTNAME = 'github.com';

/**
 * GitHub domains pattern for more comprehensive detection
 */
export const GITHUB_DOMAINS = [GITHUB_HOSTNAME, 'www.github.com'];

/**
 * Check if the current page is on any GitHub domain (including www subdomain)
 * @returns True if current page is on any GitHub domain, false otherwise
 * @example
 * ```ts
 * // Check if current page is on any GitHub domain
 * if (isAnyGithubDomain()) {
 *   // Render GitHub-specific content
 * }
 * ```
 */
export const isAnyGithubDomain = (): boolean => {
  try {
    const hostname = window.location.hostname;
    return GITHUB_DOMAINS.includes(hostname);
  } catch (error) {
    console.error(
      'Error checking if page is on any GitHub domain:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

export default isGithub;
