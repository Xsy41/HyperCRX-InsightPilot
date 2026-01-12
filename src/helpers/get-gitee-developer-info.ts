import { metaStore } from '../api/common';

import $ from 'jquery';
import * as pageDetect from 'github-url-detection';
import { getPlatform } from './get-platform';

export function getDeveloperName() {
  const developerNameByUrl = getDeveloperNameByUrl();
  const developerNameByPage = getDeveloperNameByPage();
  if (developerNameByUrl.toLowerCase() === developerNameByPage.toLowerCase()) {
    return developerNameByPage;
  }
  return developerNameByUrl;
}

export function getDeveloperNameByPage() {
  return $('.users__personal-name p').first().text().trim().replace('@', '');
}

export function getDeveloperNameByUrl() {
  const currentUrl = window.location.href;
  const parsedUrl = new URL(currentUrl);
  const pathParts = parsedUrl.pathname.split('/');
  const developerName = pathParts[pathParts.length - 1];
  return developerName;
}

export async function isDeveloperWithMeta() {
  const platform = getPlatform();
  if (platform === 'unknown') {
    return false;
  }
  return isUserProfile() && (await metaStore.has(platform, getDeveloperName()));
}

export async function isUserProfile() {
  const currentUrl = window.location.href;
  const parsedUrl = new URL(currentUrl);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  // Gitee user profile URL format: https://gitee.com/{username}
  return pathParts.length === 1 && parsedUrl.search === '';
}
