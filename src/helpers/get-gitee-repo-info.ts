/**
 * Gitee repository information utilities
 * @zh-CN Gitee仓库信息工具
 */

import { metaStore } from '../api/common';
import { getPlatform } from './get-platform';
import elementReady from 'element-ready';

/**
 * Gitee repository information interface
 */
export interface GiteeRepoInfo {
  /** Full repository name in format "owner/repo" */
  fullName: string;
  /** Repository owner username */
  owner: string;
  /** Repository name */
  repo: string;
  /** Repository description */
  description?: string;
  /** Repository visibility (public/private) */
  visibility?: 'public' | 'private';
  /** Repository type (normal/fork/mirror) */
  type?: 'normal' | 'fork' | 'mirror';
  /** Number of stars */
  starCount?: number;
  /** Number of forks */
  forkCount?: number;
  /** Number of watchers */
  watchCount?: number;
  /** Number of issues */
  issueCount?: number;
  /** Number of pull requests */
  prCount?: number;
  /** Main branch name */
  mainBranch?: string;
  /** Current branch name */
  currentBranch?: string;
  /** Repository creation date */
  createdAt?: string;
  /** Repository last updated date */
  updatedAt?: string;
  /** Fork source URL (if applicable) */
  forkSource?: string;
  /** Mirror source URL (if applicable) */
  mirrorSource?: string;
  /** Language information */
  language?: string;
  /** Topics/keywords */
  topics?: string[];
}

/**
 * Cache for repository info to avoid repeated DOM queries
 */
let repoInfoCache: GiteeRepoInfo | null = null;

/**
 * Clear the repository info cache
 */
export function clearRepoInfoCache(): void {
  repoInfoCache = null;
}

/**
 * Extract repository owner and name from URL
 * @returns Object with owner and repo properties
 */
export function parseRepoUrl(): { owner: string; repo: string } {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee repo URL format: https://gitee.com/{owner}/{repo}
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1],
      };
    }

    return { owner: '', repo: '' };
  } catch (error) {
    console.error('Error parsing repository URL:', error instanceof Error ? error.message : String(error));
    return { owner: '', repo: '' };
  }
}

/**
 * Get the current repository name in format "owner/repo"
 * @returns Full repository name
 */
export function getRepoName(): string {
  const { owner, repo } = parseRepoUrl();
  return owner && repo ? `${owner}/${repo}` : '';
}

/**
 * Get the current repository name from URL
 * @returns Full repository name
 */
export function getRepoNameByUrl(): string {
  return getRepoName();
}

/**
 * Get the repository owner username
 * @returns Owner username
 */
export function getRepoOwner(): string {
  const { owner } = parseRepoUrl();
  return owner;
}

/**
 * Get just the repository name (without owner)
 * @returns Repository name
 */
export function getShortRepoName(): string {
  const { repo } = parseRepoUrl();
  return repo;
}

/**
 * Check if the current page is a repository root page
 * @returns True if current page is repo root
 */
export function isRepoRoot(): boolean {
  try {
    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee repo root URL format: https://gitee.com/{owner}/{repo}
    return pathParts.length === 2 && parsedUrl.search === '';
  } catch (error) {
    console.error('Error checking if page is repo root:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if the current page is a repository page (any repo page, not just root)
 * @returns True if current page is a repository page
 */
export function isRepoPage(): boolean {
  try {
    const { owner, repo } = parseRepoUrl();
    return !!owner && !!repo;
  } catch (error) {
    console.error('Error checking if page is repo page:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if the repository has a container header
 * @returns True if repo has container header
 */
export function hasRepoContainerHeader(): boolean {
  const headerElement = document.querySelector('#git-project-header-details');
  return headerElement !== null && !headerElement.hasAttribute('hidden');
}

/**
 * Check if the repository is public
 * @returns True if repository is public
 */
export async function isPublicRepo(): Promise<boolean> {
  try {
    // Try multiple selectors for robustness
    const selectors = [
      '.gitee-project-extension .extension.public',
      '.project-info .visibility.public',
      '.repository-visibility.public',
    ];

    for (const selector of selectors) {
      const element = await elementReady(selector, { waitForChildren: false });
      if (element) {
        // Check if element is visible and not hidden
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
          return true;
        }
      }
    }

    // Fallback: Check for private indicators
    const privateIndicators = await Promise.all([
      elementReady('.gitee-project-extension .extension.private', { waitForChildren: false }),
      elementReady('.project-info .visibility.private', { waitForChildren: false }),
      elementReady('.repository-visibility.private', { waitForChildren: false }),
    ]);

    // If no private indicators found, assume public (default visibility)
    return !privateIndicators.some((indicator) => indicator !== null);
  } catch (error) {
    console.error('Error checking if repository is public:', error instanceof Error ? error.message : String(error));
    return true; // Assume public by default on error
  }
}

/**
 * Check if the repository has metadata and is public
 * @returns True if repository has metadata and is public
 */
export async function isPublicRepoWithMeta(): Promise<boolean> {
  try {
    const platform = getPlatform();
    if (platform === 'unknown') {
      return false;
    }

    const repoName = getRepoName();
    return repoName && (await isPublicRepo()) && (await metaStore.has(platform, repoName));
  } catch (error) {
    console.error('Error checking if repo has metadata:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Get the current branch name
 * @returns Current branch name or empty string if not found
 */
export function getCurrentBranch(): string {
  try {
    // Try multiple selectors for current branch
    const selectors = [
      '.current-branch-name',
      '.branch-selector .active',
      '.ref-selector .active-branch',
      '.git-branch',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const branchName = element.textContent?.trim() || '';
        // Remove any git ref prefixes if present
        return branchName.replace(/^refs\/heads\//, '');
      }
    }

    return '';
  } catch (error) {
    console.error('Error getting current branch:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

/**
 * Check if the repository is a fork
 * @returns True if repository is a fork
 */
export async function isForkedRepo(): Promise<boolean> {
  try {
    const forkIndicators = await Promise.all([
      elementReady('.fork-flag', { waitForChildren: false }),
      elementReady('.repository-type.fork', { waitForChildren: false }),
      elementReady('.project-info .fork-source', { waitForChildren: false }),
    ]);

    return forkIndicators.some((indicator) => indicator !== null);
  } catch (error) {
    console.error('Error checking if repository is a fork:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if the repository is a mirror
 * @returns True if repository is a mirror
 */
export async function isMirrorRepo(): Promise<boolean> {
  try {
    const mirrorIndicators = await Promise.all([
      elementReady('.mirror-flag', { waitForChildren: false }),
      elementReady('.repository-type.mirror', { waitForChildren: false }),
      elementReady('.project-info .mirror-source', { waitForChildren: false }),
    ]);

    return mirrorIndicators.some((indicator) => indicator !== null);
  } catch (error) {
    console.error('Error checking if repository is a mirror:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Get repository statistics from the page
 * @returns Object containing repo stats
 */
export function getRepoStats(): {
  starCount?: number;
  forkCount?: number;
  watchCount?: number;
  issueCount?: number;
  prCount?: number;
} {
  try {
    const stats: {
      starCount?: number;
      forkCount?: number;
      watchCount?: number;
      issueCount?: number;
      prCount?: number;
    } = {};

    // Try different approaches to get stats
    const statElements = document.querySelectorAll(
      '.project-stats li, .repository-stats .stat-item, .repo-meta .meta-item'
    );

    statElements.forEach((element) => {
      const text = element.textContent?.toLowerCase() || '';
      const countMatch = text.match(/\d+/);

      if (countMatch) {
        const count = parseInt(countMatch[0], 10);
        if (text.includes('star') || text.includes('星标')) {
          stats.starCount = count;
        } else if (text.includes('fork') || text.includes('分支')) {
          stats.forkCount = count;
        } else if (text.includes('watch') || text.includes('关注')) {
          stats.watchCount = count;
        } else if (text.includes('issue') || text.includes('问题')) {
          stats.issueCount = count;
        } else if (text.includes('pr') || text.includes('pull request') || text.includes('合并请求')) {
          stats.prCount = count;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting repo stats:', error instanceof Error ? error.message : String(error));
    return {};
  }
}

/**
 * Get complete repository information
 * @returns Complete repository info object
 */
export async function getRepoInfo(): Promise<GiteeRepoInfo> {
  // Return cached info if available
  if (repoInfoCache) {
    return repoInfoCache;
  }

  try {
    const { owner, repo } = parseRepoUrl();
    const fullName = `${owner}/${repo}`;

    // Get basic info from URL and DOM
    const isPublic = await isPublicRepo();
    const isFork = await isForkedRepo();
    const isMirror = await isMirrorRepo();
    const stats = getRepoStats();
    const currentBranch = getCurrentBranch();

    // Determine repo type
    let type: 'normal' | 'fork' | 'mirror' = 'normal';
    if (isFork) {
      type = 'fork';
    } else if (isMirror) {
      type = 'mirror';
    }

    // Create repo info object
    const repoInfo: GiteeRepoInfo = {
      fullName,
      owner,
      repo,
      visibility: isPublic ? 'public' : 'private',
      type,
      currentBranch,
      ...stats,
    };

    // Try to get additional info from DOM
    try {
      // Get repository description
      const descriptionElement = document.querySelector('.project-description, .repository-description');
      if (descriptionElement) {
        repoInfo.description = descriptionElement.textContent?.trim() || undefined;
      }

      // Get repository language
      const languageElement = document.querySelector('.project-language, .repository-language');
      if (languageElement) {
        repoInfo.language = languageElement.textContent?.trim() || undefined;
      }

      // Get repository topics
      const topicElements = document.querySelectorAll('.topic-tag, .repository-topic');
      if (topicElements.length > 0) {
        repoInfo.topics = Array.from(topicElements)
          .map((el) => el.textContent?.trim() || '')
          .filter(Boolean);
      }
    } catch (domError) {
      // Ignore DOM parsing errors for additional info
      console.debug(
        'Error parsing additional repo info from DOM:',
        domError instanceof Error ? domError.message : String(domError)
      );
    }

    // Cache the repo info
    repoInfoCache = repoInfo;

    return repoInfo;
  } catch (error) {
    console.error('Error getting repository info:', error instanceof Error ? error.message : String(error));

    // Return minimal repo info with what we can get
    const { owner, repo } = parseRepoUrl();
    return {
      fullName: `${owner}/${repo}`,
      owner,
      repo,
    };
  }
}

/**
 * Check if the current page is a repository file or directory page
 * @returns True if current page is a file/directory page
 */
export function isRepoFilePage(): boolean {
  try {
    if (!isRepoPage()) {
      return false;
    }

    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee file page format: https://gitee.com/{owner}/{repo}/blob/{branch}/{path}
    // Gitee directory page format: https://gitee.com/{owner}/{repo}/tree/{branch}/{path}
    return pathParts.length >= 4 && (pathParts[2] === 'blob' || pathParts[2] === 'tree');
  } catch (error) {
    console.error('Error checking if page is repo file page:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if the current page is a repository issues page
 * @returns True if current page is issues page
 */
export function isRepoIssuesPage(): boolean {
  try {
    if (!isRepoPage()) {
      return false;
    }

    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee issues page format: https://gitee.com/{owner}/{repo}/issues
    return pathParts.length >= 3 && pathParts[2] === 'issues';
  } catch (error) {
    console.error(
      'Error checking if page is repo issues page:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Check if the current page is a repository pull requests page
 * @returns True if current page is PRs page
 */
export function isRepoPullsPage(): boolean {
  try {
    if (!isRepoPage()) {
      return false;
    }

    const currentUrl = window.location.href;
    const parsedUrl = new URL(currentUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Gitee pull requests page format: https://gitee.com/{owner}/{repo}/pulls
    return pathParts.length >= 3 && pathParts[2] === 'pulls';
  } catch (error) {
    console.error('Error checking if page is repo pulls page:', error instanceof Error ? error.message : String(error));
    return false;
  }
}
