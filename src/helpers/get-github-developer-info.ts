/**
 * GitHub developer information utilities
 * @zh-CN GitHub开发者信息工具
 */

import { metaStore } from '../api/common';
import * as pageDetect from 'github-url-detection';
import { getPlatform } from './get-platform';

/**
 * GitHub developer profile interface
 */
export interface GitHubDeveloperProfile {
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
  /** Twitter handle */
  twitterHandle?: string;
  /** Hireable status */
  hireable?: boolean;
  /** Creation date */
  createdAt?: string;
  /** Last updated date */
  updatedAt?: string;
}

/**
 * Cache for developer info to avoid repeated DOM queries
 */
let developerInfoCache: GitHubDeveloperProfile | null = null;

/**
 * Clear the developer info cache
 */
export function clearDeveloperInfoCache(): void {
  developerInfoCache = null;
}

/**
 * Check if the user is logged in to GitHub
 * @returns True if user is logged in
 */
export function checkLogined(): boolean {
  const metaElement = document.querySelector('meta[name="user-login"]');
  return !!metaElement?.getAttribute('content');
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

    // GitHub user profile URL format: https://github.com/{username}
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
 * Get the current developer's username from page content
 * @returns Username from page content
 */
export function getDeveloperNameByPage(): string {
  try {
    // Try multiple selectors for robustness
    const selectors = [
      '.p-nickname.vcard-username.d-block',
      '.vcard-username',
      '[itemprop="additionalName"]',
      '.Header-link[href*="/settings/profile"]', // For logged in user's profile link
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        let username = element.textContent?.trim() || '';

        // Remove @ symbol if present
        username = username.replace('@', '');

        // For profile link selector, extract from href
        if (element instanceof HTMLAnchorElement) {
          const pathParts = element.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            username = pathParts[0];
          }
        }

        return username;
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
 * Check if the current page is a GitHub user profile page
 * @returns True if current page is a user profile
 */
export async function isUserProfile(): Promise<boolean> {
  return pageDetect.isUserProfile();
}

/**
 * Check if the current page is a GitHub user followers page
 * @returns True if current page is followers page
 */
export function isFollowersPage(): boolean {
  return pageDetect.isFollowersPage();
}

/**
 * Check if the current page is a GitHub user following page
 * @returns True if current page is following page
 */
export function isFollowingPage(): boolean {
  return pageDetect.isFollowingPage();
}

/**
 * Check if the current page is a GitHub user repositories page
 * @returns True if current page is repositories page
 */
export function isUserRepositoriesPage(): boolean {
  return pageDetect.isUserRepositoriesPage();
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
    return username && (await pageDetect.isUserProfile()) && (await metaStore.has(platform, username));
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
    // Try multiple selectors for robustness
    const selectors = [
      '.avatar-user',
      '.user-profile-avatar img',
      '[itemprop="image"]',
      '.avatar[src*="avatars.githubusercontent.com"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector<HTMLImageElement>(selector);
      if (element) {
        return element.src;
      }
    }

    return undefined;
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
    // Try multiple selectors for robustness
    const selectors = ['.p-note.user-profile-bio', '[itemprop="description"]', '.user-profile-bio'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || undefined;
      }
    }

    return undefined;
  } catch (error) {
    console.error('Error getting developer bio:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Get developer's statistics from the page
 * @returns Object containing developer stats
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

    // Try different approaches to get stats
    const statLinks = document.querySelectorAll('.UnderlineNav-item');
    statLinks.forEach((link) => {
      const text = link.textContent?.toLowerCase() || '';
      const countMatch = text.match(/\d+/);

      if (countMatch) {
        const count = parseInt(countMatch[0], 10);
        if (text.includes('repo')) {
          stats.repoCount = count;
        } else if (text.includes('follower')) {
          stats.followerCount = count;
        } else if (text.includes('following')) {
          stats.followingCount = count;
        } else if (text.includes('star')) {
          stats.starredCount = count;
        }
      }
    });

    // Fallback: Try to get stats from profile sidebar
    if (!stats.repoCount) {
      const repoCountElement = document.querySelector('.Counter[href*="/repositories"]');
      if (repoCountElement) {
        const countMatch = repoCountElement.textContent?.match(/\d+/);
        if (countMatch) {
          stats.repoCount = parseInt(countMatch[0], 10);
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
export function getDeveloperProfile(): GitHubDeveloperProfile {
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

    const profile: GitHubDeveloperProfile = {
      username,
      displayName,
      avatarUrl,
      bio,
      ...stats,
    };

    // Try to get additional info from DOM
    try {
      // Get location
      const locationElement = document.querySelector('.p-label[itemprop="homeLocation"]');
      if (locationElement) {
        profile.location = locationElement.textContent?.trim() || undefined;
      }

      // Get company
      const companyElement = document.querySelector('.p-org[itemprop="worksFor"]');
      if (companyElement) {
        profile.company = companyElement.textContent?.trim() || undefined;
      }

      // Get email
      const emailElement = document.querySelector('.u-email[itemprop="email"]');
      if (emailElement) {
        profile.email = emailElement.textContent?.trim() || undefined;
      }

      // Get blog URL
      const blogElement = document.querySelector('.u-url[itemprop="url"]');
      if (blogElement instanceof HTMLAnchorElement) {
        profile.blogUrl = blogElement.href;
      }

      // Get Twitter handle
      const twitterElement = document.querySelector('.Link[href*="twitter.com"]');
      if (twitterElement) {
        const twitterText = twitterElement.textContent?.trim() || '';
        if (twitterText) {
          profile.twitterHandle = twitterText.replace('@', '');
        }
      }

      // Get hireable status
      const hireableElement = document.querySelector('.octicon-check-circle');
      if (hireableElement) {
        profile.hireable = true;
      }
    } catch (domError) {
      // Ignore DOM parsing errors for additional info
      console.debug(
        'Error parsing additional developer info from DOM:',
        domError instanceof Error ? domError.message : String(domError)
      );
    }

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
 * Get the current developer's URL
 * @returns Developer profile URL
 */
export function getDeveloperUrl(): string {
  const username = getDeveloperName();
  if (username) {
    return `https://github.com/${username}`;
  }
  return window.location.origin;
}

/**
 * Check if the current page is a developer's activity page
 * @returns True if current page is an activity page
 */
export function isDeveloperActivityPage(): boolean {
  try {
    const currentUrl = window.location.href;
    return currentUrl.includes('/activity');
  } catch (error) {
    console.error('Error checking if page is activity page:', error instanceof Error ? error.message : String(error));
    return false;
  }
}
