import { metaStore } from '../api/common';

import * as pageDetect from 'github-url-detection';
import elementReady from 'element-ready';
import { getPlatform } from './get-platform';

export function getRepoName() {
  const repoNameByUrl = getRepoNameByUrl();
  const repoNameByPage = getRepoNameByPage();
  if (repoNameByUrl.toLowerCase() === repoNameByPage.toLowerCase()) {
    return repoNameByPage;
  }
  return repoNameByUrl;
}

export function getRepoNameByPage() {
  const repoName: string[] = [];
  const elements = document.querySelectorAll('header span.AppHeader-context-item-label');
  elements.forEach((element) => {
    const text = element.textContent?.trim() || '';
    if (text) {
      repoName.push(text);
    }
  });
  if (repoName.length >= 2) {
    return `${repoName[0]}/${repoName[1]}`;
  }
  return '';
}

export function getRepoNameByUrl() {
  const repoInfo = pageDetect.utils.getRepositoryInfo(window.location);
  if (!repoInfo) {
    return '';
  }
  return repoInfo.nameWithOwner;
}

export function hasRepoContainerHeader() {
  const headerElement = document.querySelector('#repository-container-header');
  return headerElement && !headerElement.hasAttribute('hidden');
}

export async function isRepoRoot() {
  return pageDetect.isRepoRoot();
}

/**
 * check if the repository is public
 */
export async function isPublicRepo() {
  const selector = 'meta[name="octolytics-dimension-repository_public"]';
  await elementReady(selector);
  // <meta name="octolytics-dimension-repository_public" content="true/false">
  const metaElement = document.querySelector(selector);
  const isPublic = metaElement?.getAttribute('content') === 'true';
  return pageDetect.isRepo() && !!isPublic;
}
export async function isPublicRepoWithMeta() {
  const platform = getPlatform();
  if (platform === 'unknown') {
    return false;
  }
  return (await isPublicRepo()) && (await metaStore.has(platform, getRepoName()));
}
