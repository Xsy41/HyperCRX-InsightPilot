import { metaStore } from '../api/common';

import * as pageDetect from 'github-url-detection';
import { getPlatform } from './get-platform';
import elementReady from 'element-ready';

export function getRepoName() {
  const repoNameByUrl = getRepoNameByUrl();
  return repoNameByUrl;
}

export function getRepoNameByUrl() {
  const currentUrl = window.location.href;
  const parsedUrl = new URL(currentUrl);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    return `${pathParts[0]}/${pathParts[1]}`;
  }
  return '';
}
export async function isRepoRoot() {
  const currentUrl = window.location.href;
  const parsedUrl = new URL(currentUrl);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  // Gitee repo root URL format: https://gitee.com/{owner}/{repo}
  return pathParts.length === 2 && parsedUrl.search === '';
}
export function hasRepoContainerHeader() {
  const headerElement = document.querySelector('#git-project-header-details');
  return headerElement && !headerElement.hasAttribute('hidden');
}

/**
 * check if the repository is public
 */
export async function isPublicRepo() {
  const elements = await elementReady('.gitee-project-extension .extension.public');
  if (!elements) {
    return false;
  }
  return elements.textContent?.trim() === '1';
}
export async function isPublicRepoWithMeta() {
  const platform = getPlatform();
  if (platform === 'unknown') {
    return false;
  }
  return (await isPublicRepo()) && (await metaStore.has(platform, getRepoNameByUrl()));
}
