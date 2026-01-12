import isGitee from './is-gitee';
import isGithub from './is-github';

// Cache the platform result for better performance
let cachedPlatform: 'github' | 'gitee' | 'unknown' | null = null;

export const getPlatform = (): 'github' | 'gitee' | 'unknown' => {
  // Return cached result if available
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  // Determine platform and cache the result
  if (isGithub()) {
    cachedPlatform = 'github';
  } else if (isGitee()) {
    cachedPlatform = 'gitee';
  } else {
    cachedPlatform = 'unknown';
  }

  return cachedPlatform;
};

// Reset cache function for testing or dynamic platform changes
export const resetPlatformCache = (): void => {
  cachedPlatform = null;
};
