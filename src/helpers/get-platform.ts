/**
 * Platform detection utilities
 * Provides functions to detect the current platform (GitHub, Gitee, or unknown)
 */

import isGitee from './is-gitee';
import isGithub from './is-github';

/**
 * Supported platform types
 */
export type PlatformType = 'github' | 'gitee' | 'unknown';

/**
 * Cache the platform result for better performance
 */
let cachedPlatform: PlatformType | null = null;

/**
 * Get the current platform type
 * @returns Platform type (github, gitee, or unknown)
 */
export const getPlatform = (): PlatformType => {
  // Return cached result if available
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  try {
    // Determine platform based on URL detection
    let platform: PlatformType = 'unknown';

    if (isGithub()) {
      platform = 'github';
    } else if (isGitee()) {
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
 */
export const isGitHubPlatform = (): boolean => {
  return getPlatform() === 'github';
};

/**
 * Check if current platform is Gitee
 * @returns True if current platform is Gitee, false otherwise
 */
export const isGiteePlatform = (): boolean => {
  return getPlatform() === 'gitee';
};

/**
 * Check if current platform is unknown
 * @returns True if current platform is unknown, false otherwise
 */
export const isUnknownPlatform = (): boolean => {
  return getPlatform() === 'unknown';
};

/**
 * Reset the platform cache
 * Useful for testing or when platform might change dynamically
 */
export const resetPlatformCache = (): void => {
  cachedPlatform = null;
};
