/**
 * Platform detection utilities
 * @zh-CN 平台检测工具
 * Provides functions to detect the current platform (GitHub, Gitee, or unknown)
 */

import { isAnyGithubDomain, resetGithubCache } from './is-github';
import { isAnyGiteeDomain, resetGiteeCache } from './is-gitee';

/**
 * Supported platform types
 */
export type PlatformType = 'github' | 'gitee' | 'unknown';

/**
 * All supported platform types as an array
 */
export const ALL_PLATFORMS: PlatformType[] = ['github', 'gitee', 'unknown'];

/**
 * Cache the platform result for better performance
 */
let cachedPlatform: PlatformType | null = null;

/**
 * Get the current platform type
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
 * ```
 */
export const getPlatform = (): PlatformType => {
  // Return cached result if available
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  try {
    // Determine platform based on URL detection
    // Using isAnyGithubDomain and isAnyGiteeDomain for more comprehensive detection
    let platform: PlatformType = 'unknown';

    if (isAnyGithubDomain()) {
      platform = 'github';
    } else if (isAnyGiteeDomain()) {
      platform = 'gitee';
    }

    // Cache the result for future calls
    cachedPlatform = platform;
    return platform;
  } catch (error) {
    console.error('Error detecting platform:', error instanceof Error ? error.message : String(error));
    return 'unknown';
  }
};

/**
 * Check if current platform is GitHub
 * @returns True if current platform is GitHub, false otherwise
 * @example
 * ```ts
 * // Check if current platform is GitHub
 * if (isGitHubPlatform()) {
 *   // Render GitHub-specific content
 * }
 * ```
 */
export const isGitHubPlatform = (): boolean => {
  return getPlatform() === 'github';
};

/**
 * Check if current platform is Gitee
 * @returns True if current platform is Gitee, false otherwise
 * @example
 * ```ts
 * // Check if current platform is Gitee
 * if (isGiteePlatform()) {
 *   // Render Gitee-specific content
 * }
 * ```
 */
export const isGiteePlatform = (): boolean => {
  return getPlatform() === 'gitee';
};

/**
 * Check if current platform is unknown
 * @returns True if current platform is unknown, false otherwise
 * @example
 * ```ts
 * // Check if current platform is unknown
 * if (isUnknownPlatform()) {
 *   // Render fallback content
 * }
 * ```
 */
export const isUnknownPlatform = (): boolean => {
  return getPlatform() === 'unknown';
};

/**
 * Check if current platform is supported (GitHub or Gitee)
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
export const isSupportedPlatform = (): boolean => {
  const platform = getPlatform();
  return platform === 'github' || platform === 'gitee';
};

/**
 * Get a platform-specific value based on the current platform
 * @param values An object mapping platform types to values
 * @param defaultValue Default value to return if platform is unknown
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
export const getPlatformValue = <T>(values: Partial<Record<PlatformType, T>>, defaultValue: T): T => {
  const platform = getPlatform();
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
 * @returns Platform type if the URL belongs to a supported platform, unknown otherwise
 * @example
 * ```ts
 * // Check platform of a URL
 * const platform = getPlatformFromUrl('https://github.com/hypertrons/hypertrons-crx'); // 'github'
 * const platform = getPlatformFromUrl('https://gitee.com'); // 'gitee'
 * const platform = getPlatformFromUrl('https://example.com'); // 'unknown'
 * ```
 */
export const getPlatformFromUrl = (url: string): PlatformType => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (hostname === 'github.com' || hostname === 'www.github.com') {
      return 'github';
    } else if (hostname === 'gitee.com' || hostname === 'www.gitee.com') {
      return 'gitee';
    }
    return 'unknown';
  } catch (error) {
    console.error('Error detecting platform from URL:', error instanceof Error ? error.message : String(error));
    return 'unknown';
  }
};
