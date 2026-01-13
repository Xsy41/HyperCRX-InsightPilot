/**
 * Gitee platform detection utility
 * @zh-CN Gitee平台检测工具
 */

/**
 * Cached result interface with timestamp for cache expiration
 */
interface CachedResult {
  value: boolean;
  timestamp: number;
}

/** Cached result for better performance */
let cachedResult: CachedResult | null = null;

/** Cache expiration time in milliseconds (5 minutes) */
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Check if a hostname matches Gitee domain patterns
 * @param hostname The hostname to check
 * @param includeEnterprise Whether to include Gitee Enterprise domains
 * @returns True if hostname matches Gitee domain patterns
 */
const isGiteeHostname = (hostname: string, includeEnterprise = false): boolean => {
  // Check if it's a standard Gitee domain
  if (GITEE_DOMAINS.includes(hostname)) {
    return true;
  }

  // Check if it's a Gitee Enterprise domain
  if (includeEnterprise) {
    // Gitee Enterprise domains typically end with .gitee.com or have gitee in the domain
    return hostname.endsWith('.gitee.com') || hostname.includes('gitee');
  }

  return false;
};

/**
 * Check if the current page is hosted on Gitee
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include Gitee Enterprise domains
 * @returns True if current page is on Gitee, false otherwise
 * @example
 * ```ts
 * // Check if current page is on Gitee
 * if (isGitee()) {
 *   // Render Gitee-specific content
 * }
 *
 * // Check if current page is on Gitee or Gitee Enterprise
 * if (isGitee({ includeEnterprise: true })) {
 *   // Render Gitee Enterprise-specific content
 * }
 * ```
 */
export const isGitee = (options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  // Check if cache is valid
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY) {
    return cachedResult.value;
  }

  try {
    // Check if hostname is Gitee
    const isGiteeHost = isGiteeHostname(window.location.hostname, includeEnterprise);

    // Cache the result for future calls
    cachedResult = {
      value: isGiteeHost,
      timestamp: Date.now(),
    };
    return isGiteeHost;
  } catch (error) {
    console.error('Error checking if page is Gitee:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Check if a given URL is hosted on Gitee
 * @param url The URL to check
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include Gitee Enterprise domains
 * @returns True if the URL is on Gitee, false otherwise
 * @example
 * ```ts
 * // Check if a specific URL is on Gitee
 * const isGiteeUrl = isGiteeUrl('https://gitee.com/hypertrons/hypertrons-crx'); // true
 * const isGiteeUrl = isGiteeUrl('https://github.com'); // false
 *
 * // Check if a URL is on Gitee Enterprise
 * const isGiteeEnterpriseUrl = isGiteeUrl('https://gitee.example.com', { includeEnterprise: true }); // true
 * ```
 */
export const isGiteeUrl = (url: string, options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  try {
    const urlObj = new URL(url);
    return isGiteeHostname(urlObj.hostname, includeEnterprise);
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
export const GITEE_DOMAINS = [GITEE_HOSTNAME, 'www.gitee.com', 'gitee.com'];

/**
 * Check if the current page is on any Gitee domain (including www subdomain)
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include Gitee Enterprise domains
 * @returns True if current page is on any Gitee domain, false otherwise
 * @example
 * ```ts
 * // Check if current page is on any Gitee domain
 * if (isAnyGiteeDomain()) {
 *   // Render Gitee-specific content
 * }
 * ```
 */
export const isAnyGiteeDomain = (options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  try {
    const hostname = window.location.hostname;
    return isGiteeHostname(hostname, includeEnterprise);
  } catch (error) {
    console.error(
      'Error checking if page is on any Gitee domain:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

/**
 * Check if the current page is a Gitee repository page
 * @returns True if current page is a Gitee repository page, false otherwise
 * @example
 * ```ts
 * // Check if current page is a Gitee repository page
 * if (isGiteeRepoPage()) {
 *   // Render repository-specific content
 * }
 * ```
 */
export const isGiteeRepoPage = (): boolean => {
  if (!isGitee()) {
    return false;
  }

  try {
    const pathname = window.location.pathname;
    // Gitee repository URLs typically have format /owner/repo
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length >= 2;
  } catch (error) {
    console.error(
      'Error checking if page is Gitee repository page:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

/**
 * Check if the current page is a Gitee user profile page
 * @returns True if current page is a Gitee user profile page, false otherwise
 * @example
 * ```ts
 * // Check if current page is a Gitee user profile page
 * if (isGiteeUserPage()) {
 *   // Render user-specific content
 * }
 * ```
 */
export const isGiteeUserPage = (): boolean => {
  if (!isGitee()) {
    return false;
  }

  try {
    const pathname = window.location.pathname;
    // Gitee user URLs typically have format /username
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length === 1;
  } catch (error) {
    console.error('Error checking if page is Gitee user page:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Extract Gitee repository information from URL
 * @param url Optional URL to extract from, defaults to current page URL
 * @returns Object with owner and repo information if valid, null otherwise
 * @example
 * ```ts
 * // Extract repository information from current URL
 * const repoInfo = getGiteeRepoInfo();
 * if (repoInfo) {
 *   console.log(repoInfo.owner, repoInfo.repo);
 * }
 *
 * // Extract repository information from specific URL
 * const repoInfo = getGiteeRepoInfo('https://gitee.com/hypertrons/hypertrons-crx');
 * console.log(repoInfo.owner, repoInfo.repo); // hypertrons hypertrons-crx
 * ```
 */
export const getGiteeRepoInfo = (url?: string): { owner: string; repo: string } | null => {
  try {
    const targetUrl = url || window.location.href;
    const urlObj = new URL(targetUrl);

    if (!isGiteeUrl(targetUrl)) {
      return null;
    }

    const pathname = urlObj.pathname;
    const pathParts = pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return null;
    }

    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  } catch (error) {
    console.error(
      'Error extracting Gitee repository information:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};

export default isGitee;
