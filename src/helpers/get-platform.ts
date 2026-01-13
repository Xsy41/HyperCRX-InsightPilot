/**
 * Platform detection utilities
 * @zh-CN 平台检测工具
 * Provides functions to detect the current platform (GitHub, Gitee, or unknown)
 */

import { isAnyGithubDomain, isGithubUrl, resetGithubCache } from './is-github';
import { isAnyGiteeDomain, isGiteeUrl, resetGiteeCache } from './is-gitee';

/**
 * Supported platform types
 */
export type PlatformType = 'github' | 'gitee' | 'unknown';

/**
 * All supported platform types as an array
 */
export const ALL_PLATFORMS: PlatformType[] = ['github', 'gitee', 'unknown'];

/**
 * Cached result interface with timestamp for cache expiration
 */
interface CachedPlatformResult {
  value: PlatformType;
  timestamp: number;
}

/**
 * Cache the platform result for better performance
 */
let cachedPlatform: CachedPlatformResult | null = null;

/** Cache expiration time in milliseconds (5 minutes) */
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Get the current platform type
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns Platform type (github, gitee, or unknown)
 * @example
 * ```ts
 * // Get current platform
 * const platform = getPlatform();
 *
 * // Switch based on platform
 * switch (platform) {
 *   case 'github':
 *     // Handle GitHub
 *     break;
 *   case 'gitee':
 *     // Handle Gitee
 *     break;
 *   default:
 *     // Handle unknown platform
 * }
 *
 * // Get current platform including enterprise domains
 * const platform = getPlatform({ includeEnterprise: true });
 * ```
 */
export const getPlatform = (options: { includeEnterprise?: boolean } = {}): PlatformType => {
  const { includeEnterprise = false } = options;

  // Check if cache is valid
  if (cachedPlatform && Date.now() - cachedPlatform.timestamp < CACHE_EXPIRY) {
    return cachedPlatform.value;
  }

  try {
    // Determine platform based on URL detection
    // Using isAnyGithubDomain and isAnyGiteeDomain for more comprehensive detection
    let platform: PlatformType = 'unknown';

    if (isAnyGithubDomain({ includeEnterprise })) {
      platform = 'github';
    } else if (isAnyGiteeDomain({ includeEnterprise })) {
      platform = 'gitee';
    }

    // Cache the result for future calls
    cachedPlatform = {
      value: platform,
      timestamp: Date.now(),
    };
    return platform;
  } catch (error) {
    console.error('Error detecting platform:', error instanceof Error ? error.message : String(error));
    return 'unknown';
  }
};

/**
 * Check if current platform is GitHub
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns True if current platform is GitHub, false otherwise
 * @example
 * ```ts
 * // Check if current platform is GitHub
 * if (isGitHubPlatform()) {
 *   // Render GitHub-specific content
 * }
 *
 * // Check if current platform is GitHub Enterprise
 * if (isGitHubPlatform({ includeEnterprise: true })) {
 *   // Render GitHub Enterprise-specific content
 * }
 * ```
 */
export const isGitHubPlatform = (options: { includeEnterprise?: boolean } = {}): boolean => {
  return getPlatform(options) === 'github';
};

/**
 * Check if current platform is Gitee
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns True if current platform is Gitee, false otherwise
 * @example
 * ```ts
 * // Check if current platform is Gitee
 * if (isGiteePlatform()) {
 *   // Render Gitee-specific content
 * }
 *
 * // Check if current platform is Gitee Enterprise
 * if (isGiteePlatform({ includeEnterprise: true })) {
 *   // Render Gitee Enterprise-specific content
 * }
 * ```
 */
export const isGiteePlatform = (options: { includeEnterprise?: boolean } = {}): boolean => {
  return getPlatform(options) === 'gitee';
};

/**
 * Check if current platform is unknown
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns True if current platform is unknown, false otherwise
 * @example
 * ```ts
 * // Check if current platform is unknown
 * if (isUnknownPlatform()) {
 *   // Render fallback content
 * }
 * ```
 */
export const isUnknownPlatform = (options: { includeEnterprise?: boolean } = {}): boolean => {
  return getPlatform(options) === 'unknown';
};

/**
 * Check if current platform is supported (GitHub or Gitee)
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns True if current platform is supported, false otherwise
 * @example
 * ```ts
 * // Check if current platform is supported
 * if (isSupportedPlatform()) {
 *   // Render platform-specific content
 * } else {
 *   // Show unsupported platform message
 * }
 * ```
 */
export const isSupportedPlatform = (options: { includeEnterprise?: boolean } = {}): boolean => {
  const platform = getPlatform(options);
  return platform === 'github' || platform === 'gitee';
};

/**
 * Get a platform-specific value based on the current platform
 * @param values An object mapping platform types to values
 * @param defaultValue Default value to return if platform is unknown
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns The value for the current platform or the default value
 * @example
 * ```ts
 * // Get platform-specific API endpoint
 * const apiEndpoint = getPlatformValue({
 *   github: 'https://api.github.com',
 *   gitee: 'https://gitee.com/api/v5'
 * }, 'https://default-api.com');
 * ```
 */
export const getPlatformValue = <T>(
  values: Partial<Record<PlatformType, T>>,
  defaultValue: T,
  options: { includeEnterprise?: boolean } = {}
): T => {
  const platform = getPlatform(options);
  return values[platform] ?? defaultValue;
};

/**
 * Reset the platform cache and all related caches
 * Useful for testing or when navigation occurs
 * @example
 * ```ts
 * // Reset cache after navigation
 * window.addEventListener('popstate', () => {
 *   resetPlatformCache();
 * });
 * ```
 */
export const resetPlatformCache = (): void => {
  cachedPlatform = null;
  resetGithubCache();
  resetGiteeCache();
};

/**
 * Check if a given URL belongs to any supported platform
 * @param url The URL to check
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns Platform type if the URL belongs to a supported platform, unknown otherwise
 * @example
 * ```ts
 * // Check platform of a URL
 * const platform = getPlatformFromUrl('https://github.com/hypertrons/hypertrons-crx'); // 'github'
 * const platform = getPlatformFromUrl('https://gitee.com'); // 'gitee'
 * const platform = getPlatformFromUrl('https://example.com'); // 'unknown'
 *
 * // Check platform of a URL including enterprise domains
 * const platform = getPlatformFromUrl('https://github.example.com', { includeEnterprise: true }); // 'github'
 * ```
 */
export const getPlatformFromUrl = (url: string, options: { includeEnterprise?: boolean } = {}): PlatformType => {
  const { includeEnterprise = false } = options;

  try {
    if (isGithubUrl(url, { includeEnterprise })) {
      return 'github';
    } else if (isGiteeUrl(url, { includeEnterprise })) {
      return 'gitee';
    }
    return 'unknown';
  } catch (error) {
    console.error('Error detecting platform from URL:', error instanceof Error ? error.message : String(error));
    return 'unknown';
  }
};

/**
 * Execute a function based on the current platform
 * @param handlers An object mapping platform types to functions
 * @param options Configuration options
 * @param options.includeEnterprise Whether to include enterprise domains
 * @returns The result of the executed function or undefined if no handler matches
 * @example
 * ```ts
 * // Execute platform-specific function
 * executePlatformFunction({
 *   github: () => {
 *     console.log('Running on GitHub');
 *     return 'github-result';
 *   },
 *   gitee: () => {
 *     console.log('Running on Gitee');
 *     return 'gitee-result';
 *   },
 *   unknown: () => {
 *     console.log('Running on unknown platform');
 *     return 'unknown-result';
 *   }
 * });
 * ```
 */
export const executePlatformFunction = <T>(
  handlers: Partial<Record<PlatformType, () => T>>,
  options: { includeEnterprise?: boolean } = {}
): T | undefined => {
  const platform = getPlatform(options);
  const handler = handlers[platform];
  return handler ? handler() : undefined;
};

/**
 * Get platform display name for UI purposes
 * @param platform Platform type
 * @returns Human-readable platform name
 * @example
 * ```ts
 * // Get platform display name
 * const displayName = getPlatformDisplayName('github'); // 'GitHub'
 * const displayName = getPlatformDisplayName('gitee'); // 'Gitee'
 * const displayName = getPlatformDisplayName('unknown'); // 'Unknown'
 * ```
 */
export const getPlatformDisplayName = (platform: PlatformType): string => {
  const names: Record<PlatformType, string> = {
    github: 'GitHub',
    gitee: 'Gitee',
    unknown: 'Unknown',
  };
  return names[platform];
};

/**
 * Check if two platforms are the same
 * @param platform1 First platform type
 * @param platform2 Second platform type
 * @returns True if platforms are the same, false otherwise
 * @example
 * ```ts
 * // Check if two platforms are the same
 * const isSame = isSamePlatform('github', 'github'); // true
 * const isSame = isSamePlatform('github', 'gitee'); // false
 * ```
 */
export const isSamePlatform = (platform1: PlatformType, platform2: PlatformType): boolean => {
  return platform1 === platform2;
};
