/**
 * Gitee developer information utilities
 * @zh-CN Gitee开发者信息工具
 */

import { metaStore } from '../api/common';
import { getPlatform } from './get-platform';

/**
 * Gitee developer profile interface
 */
export interface GiteeDeveloperProfile {
  /** Developer username */
  username: string;
  /** Developer display name */
  displayName: string;
  /** Developer avatar URL */
  avatarUrl?: string;
  /** Developer bio/description */
  bio?: string;
  /** Number of repositories */
  repoCount?: number;
  /** Number of followers */
  followerCount?: number;
  /** Number of following */
  followingCount?: number;
  /** Number of starred repositories */
  starredCount?: number;
  /** Location */
  location?: string;
  /** Company */
  company?: string;
  /** Email */
  email?: string;
  /** Blog URL */
  blogUrl?: string;
  /** Creation date */
  createdAt?: string;
}

/**
 * Cache for developer info to avoid repeated DOM queries
 */
let developerInfoCache: GiteeDeveloperProfile | null = null;

/**
 * Clear the developer info cache
 */
export function clearDeveloperInfoCache(): void {
  developerInfoCache = null;
}

/**
 * Get the current developer's username from URL
 * @returns Username from URL
 */
export function getDeveloperNameByUrl(): string {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee user profile URL format: https://gitee.com/{username}
    if (pathParts.length >= 1) {
      return pathParts[0];
    }

    return '';
  } catch (error) {
    console.error('Error getting developer name from URL:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

/**
 * Get the current developer's display name from the page
 * @returns Display name from page or empty string if not found
 */
export function getDeveloperNameByPage(): string {
  try {
    // Try multiple selectors for robustness
    const selectors = ['.users__personal-name p', '.user-profile-head-name', '.profile-header .name'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim().replace('@', '') || '';
      }
    }

    return '';
  } catch (error) {
    console.error('Error getting developer name from page:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

/**
 * Get the current developer's username by combining URL and page information
 * @returns Normalized developer username
 */
export function getDeveloperName(): string {
  const developerNameByUrl = getDeveloperNameByUrl();
  const developerNameByPage = getDeveloperNameByPage();

  // Validate both methods return the same username (case-insensitive)
  if (developerNameByUrl && developerNameByPage) {
    if (developerNameByUrl.toLowerCase() === developerNameByPage.toLowerCase()) {
      return developerNameByPage;
    }
  }

  // Fall back to URL-based username
  return developerNameByUrl || '';
}

/**
 * Check if the current page is a Gitee user profile page
 * @returns True if current page is a user profile
 */
export function isUserProfile(): boolean {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee user profile URL format: https://gitee.com/{username}
    // Also handle special cases like https://gitee.com/{username}/followers
    return (
      parsedUrl.hostname.includes('gitee.com') &&
      pathParts.length >= 1 &&
      !['explore', 'projects', 'stars', 'trending', 'issues'].includes(pathParts[0])
    );
  } catch (error) {
    console.error('Error checking if page is user profile:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if the current developer has metadata in the store
 * @returns True if developer has metadata
 */
export async function isDeveloperWithMeta(): Promise<boolean> {
  try {
    const platform = getPlatform();
    if (platform === 'unknown') {
      return false;
    }

    const username = getDeveloperName();
    return username && isUserProfile() && (await metaStore.has(platform, username));
  } catch (error) {
    console.error('Error checking if developer has metadata:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Get developer's avatar URL from the page
 * @returns Avatar URL or undefined if not found
 */
export function getDeveloperAvatarUrl(): string | undefined {
  try {
    const avatarElement = document.querySelector('.avatar img') as HTMLImageElement;
    return avatarElement?.src || undefined;
  } catch (error) {
    console.error('Error getting developer avatar URL:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Get developer's bio from the page
 * @returns Bio text or undefined if not found
 */
export function getDeveloperBio(): string | undefined {
  try {
    const bioElement = document.querySelector('.user-info-bio');
    return bioElement?.textContent?.trim() || undefined;
  } catch (error) {
    console.error('Error getting developer bio:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Get developer's statistics from the page
 * @returns Object containing repo, follower, following, and starred counts
 */
export function getDeveloperStats(): {
  repoCount?: number;
  followerCount?: number;
  followingCount?: number;
  starredCount?: number;
} {
  try {
    const stats: {
      repoCount?: number;
      followerCount?: number;
      followingCount?: number;
      starredCount?: number;
    } = {};

    // Try different selector patterns for stats
    const statSelectors = ['.user-profile-stats li', '.stats .stat-item', '.user-data .counter'];

    for (const selector of statSelectors) {
      const statElements = document.querySelectorAll(selector);
      if (statElements.length > 0) {
        statElements.forEach((element) => {
          const text = element.textContent?.toLowerCase() || '';
          const countText = text.match(/\d+/);

          if (countText) {
            const count = parseInt(countText[0], 10);
            if (text.includes('仓库') || text.includes('repo')) {
              stats.repoCount = count;
            } else if (text.includes('关注者') || text.includes('follower')) {
              stats.followerCount = count;
            } else if (text.includes('关注') || text.includes('following')) {
              stats.followingCount = count;
            } else if (text.includes('星标') || text.includes('star')) {
              stats.starredCount = count;
            }
          }
        });

        // If we found stats, break the loop
        if (Object.keys(stats).length > 0) {
          break;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting developer stats:', error instanceof Error ? error.message : String(error));
    return {};
  }
}

/**
 * Get complete developer profile information
 * @returns Complete developer profile object
 */
export function getDeveloperProfile(): GiteeDeveloperProfile {
  // Return cached profile if available
  if (developerInfoCache) {
    return developerInfoCache;
  }

  try {
    const username = getDeveloperName();
    const displayName = getDeveloperNameByPage() || username;
    const avatarUrl = getDeveloperAvatarUrl();
    const bio = getDeveloperBio();
    const stats = getDeveloperStats();

    const profile: GiteeDeveloperProfile = {
      username,
      displayName,
      avatarUrl,
      bio,
      ...stats,
    };

    // Cache the profile
    developerInfoCache = profile;

    return profile;
  } catch (error) {
    console.error('Error getting developer profile:', error instanceof Error ? error.message : String(error));

    // Return minimal profile with username
    const username = getDeveloperName();
    return {
      username,
      displayName: username,
    };
  }
}

/**
 * Check if the current page is a developer's repository page
 * @returns True if current page is a repository page
 */
export function isDeveloperRepositoryPage(): boolean {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee repository URL format: https://gitee.com/{username}/{repo}
    return parsedUrl.hostname.includes('gitee.com') && pathParts.length >= 2;
  } catch (error) {
    console.error('Error checking if page is repository page:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Get the repository name from the current URL
 * @returns Repository name or empty string if not found
 */
export function getRepositoryNameFromUrl(): string {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee repository URL format: https://gitee.com/{username}/{repo}
    if (pathParts.length >= 2) {
      return pathParts[1];
    }

    return '';
  } catch (error) {
    console.error('Error getting repository name from URL:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

/**
 * Get the current developer's URL
 * @returns Developer profile URL
 */
export function getDeveloperUrl(): string {
  const username = getDeveloperName();
  if (username) {
    return `https://gitee.com/${username}`;
  }
  return window.location.origin;
}
