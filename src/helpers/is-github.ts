/**
 * GitHub platform detection utility
 * @zh-CN GitHub平台检测工具
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
 * Check if a hostname matches GitHub domain patterns
 * @param hostname The hostname to check
 * @param includeEnterprise Whether to include GitHub Enterprise domains
 * @returns True if hostname matches GitHub domain patterns
 */
const isGithubHostname = (hostname: string, includeEnterprise = false): boolean => {
  // Check if it's a standard GitHub domain
  if (GITHUB_DOMAINS.includes(hostname)) {
    return true;
  }

  // Check if it's a GitHub Enterprise domain
  if (includeEnterprise) {
    // GitHub Enterprise domains typically end with .github.com or have github in the domain
    return hostname.endsWith('.github.com') || (hostname.includes('github') && hostname !== 'githubusercontent.com');
  }

  return false;
};

/**
 * Check if the current page is hosted on GitHub
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include GitHub Enterprise domains
 * @returns True if current page is on GitHub, false otherwise
 * @example
 * ```ts
 * // Check if current page is on GitHub
 * if (isGithub()) {
 *   // Render GitHub-specific content
 * }
 *
 * // Check if current page is on GitHub or GitHub Enterprise
 * if (isGithub({ includeEnterprise: true })) {
 *   // Render GitHub Enterprise-specific content
 * }
 * ```
 */
export const isGithub = (options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  // Check if cache is valid
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY) {
    return cachedResult.value;
  }

  try {
    // Check if hostname is GitHub
    const isGithubHost = isGithubHostname(window.location.hostname, includeEnterprise);

    // Cache the result for future calls
    cachedResult = {
      value: isGithubHost,
      timestamp: Date.now(),
    };
    return isGithubHost;
  } catch (error) {
    console.error('Error checking if page is GitHub:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

/**
 * Check if a given URL is hosted on GitHub
 * @param url The URL to check
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include GitHub Enterprise domains
 * @returns True if the URL is on GitHub, false otherwise
 * @example
 * ```ts
 * // Check if a specific URL is on GitHub
 * const isGithubUrl = isGithubUrl('https://github.com/hypertrons/hypertrons-crx'); // true
 * const isGithubUrl = isGithubUrl('https://gitee.com'); // false
 *
 * // Check if a URL is on GitHub Enterprise
 * const isGithubEnterpriseUrl = isGithubUrl('https://github.example.com', { includeEnterprise: true }); // true
 * ```
 */
export const isGithubUrl = (url: string, options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  try {
    const urlObj = new URL(url);
    return isGithubHostname(urlObj.hostname, includeEnterprise);
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
export const GITHUB_DOMAINS = [GITHUB_HOSTNAME, 'www.github.com', 'github.com'];

/**
 * Check if the current page is on any GitHub domain (including www subdomain)
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include GitHub Enterprise domains
 * @returns True if current page is on any GitHub domain, false otherwise
 * @example
 * ```ts
 * // Check if current page is on any GitHub domain
 * if (isAnyGithubDomain()) {
 *   // Render GitHub-specific content
 * }
 * ```
 */
export const isAnyGithubDomain = (options: { includeEnterprise?: boolean } = {}): boolean => {
  const { includeEnterprise = false } = options;

  try {
    const hostname = window.location.hostname;
    return isGithubHostname(hostname, includeEnterprise);
  } catch (error) {
    console.error(
      'Error checking if page is on any GitHub domain:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

/**
 * Check if the current page is a GitHub repository page
 * @returns True if current page is a GitHub repository page, false otherwise
 * @example
 * ```ts
 * // Check if current page is a GitHub repository page
 * if (isGithubRepoPage()) {
 *   // Render repository-specific content
 * }
 * ```
 */
export const isGithubRepoPage = (): boolean => {
  if (!isGithub()) {
    return false;
  }

  try {
    const pathname = window.location.pathname;
    // GitHub repository URLs typically have format /owner/repo
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length >= 2;
  } catch (error) {
    console.error(
      'Error checking if page is GitHub repository page:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

/**
 * Check if the current page is a GitHub user profile page
 * @returns True if current page is a GitHub user profile page, false otherwise
 * @example
 * ```ts
 * // Check if current page is a GitHub user profile page
 * if (isGithubUserPage()) {
 *   // Render user-specific content
 * }
 * ```
 */
export const isGithubUserPage = (): boolean => {
  if (!isGithub()) {
    return false;
  }

  try {
    const pathname = window.location.pathname;
    // GitHub user URLs typically have format /username
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length === 1;
  } catch (error) {
    console.error(
      'Error checking if page is GitHub user page:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

/**
 * Extract GitHub repository information from URL
 * @param url Optional URL to extract from, defaults to current page URL
 * @returns Object with owner and repo information if valid, null otherwise
 * @example
 * ```ts
 * // Extract repository information from current URL
 * const repoInfo = getGithubRepoInfo();
 * if (repoInfo) {
 *   console.log(repoInfo.owner, repoInfo.repo);
 * }
 *
 * // Extract repository information from specific URL
 * const repoInfo = getGithubRepoInfo('https://github.com/hypertrons/hypertrons-crx');
 * console.log(repoInfo.owner, repoInfo.repo); // hypertrons hypertrons-crx
 * ```
 */
export const getGithubRepoInfo = (url?: string): { owner: string; repo: string } | null => {
  try {
    const targetUrl = url || window.location.href;
    const urlObj = new URL(targetUrl);

    if (!isGithubUrl(targetUrl)) {
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
      'Error extracting GitHub repository information:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};

export default isGithub;
