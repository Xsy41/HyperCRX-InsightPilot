import { getPlatform } from './get-platform';
import { getRepoName as getGithubRepoName, isPublicRepo as isGithubPublicRepo } from './get-github-repo-info';
import { getRepoName as getGiteeRepoName, isPublicRepo as isGiteePublicRepo } from './get-gitee-repo-info';
import { getDeveloperName as getGithubDeveloperName } from './get-github-developer-info';
import { getDeveloperName as getGiteeDeveloperName } from './get-gitee-developer-info';

/**
 * Get repository name (owner/repo)
 */
export function getRepoName(): string {
  const platform = getPlatform();
  if (platform === 'github') {
    return getGithubRepoName();
  } else if (platform === 'gitee') {
    return getGiteeRepoName();
  }
  return '';
}

/**
 * Check if the repository is public
 */
export async function isPublicRepo(): Promise<boolean> {
  const platform = getPlatform();
  if (platform === 'github') {
    return await isGithubPublicRepo();
  } else if (platform === 'gitee') {
    return await isGiteePublicRepo();
  }
  return false;
}

/**
 * Get username (owner) from repository name
 */
export function getUsername(): string {
  const repoName = getRepoName();
  if (!repoName) {
    return '';
  }
  const parts = repoName.split('/');
  return parts[0] || '';
}

/**
 * Get current logged-in developer/user name (not repository owner)
 */
export function getCurrentDeveloperName(): string {
  const platform = getPlatform();
  if (platform === 'github') {
    return getGithubDeveloperName();
  } else if (platform === 'gitee') {
    return getGiteeDeveloperName();
  }
  return '';
}

/**
 * Get current logged-in user avatar from GitHub page DOM
 */
export function getCurrentUserAvatar(): string | null {
  const platform = getPlatform();
  if (platform === 'github') {
    // 方法1: 从 meta 标签获取用户名（最可靠）
    const userLogin = document.querySelector('meta[name="user-login"]')?.getAttribute('content');
    if (userLogin) {
      // 使用 GitHub 头像 URL（会自动重定向到实际头像）
      return `https://github.com/${userLogin}.png`;
    }
    
    // 方法2: 从 GitHub header 导航栏获取用户头像
    // GitHub 新界面: header 中的用户下拉菜单
    const headerAvatar = document.querySelector('header [data-view-component="true"] img[alt*="@"]') as HTMLImageElement;
    if (headerAvatar && headerAvatar.src && headerAvatar.src.includes('avatars')) {
      return headerAvatar.src;
    }
    
    // 方法3: 查找 header 中所有包含 avatars 的图片
    const headerImgs = document.querySelectorAll('header img[src*="avatars.githubusercontent.com"]');
    for (const img of Array.from(headerImgs)) {
      const src = (img as HTMLImageElement).src;
      // 排除仓库 owner 的头像（通常在页面内容区域）
      if (src && !src.includes('size=') || src.includes('size=20') || src.includes('size=40')) {
        return src;
      }
    }
    
    // 方法4: 如果找到了用户名，使用默认头像 URL
    const devName = getGithubDeveloperName();
    if (devName) {
      return `https://github.com/${devName}.png`;
    }
  } else if (platform === 'gitee') {
    const devName = getGiteeDeveloperName();
    if (devName) {
      // Gitee 头像 URL 格式
      return `https://gitee.com/${devName}.png`;
    }
  }
  return null;
}

