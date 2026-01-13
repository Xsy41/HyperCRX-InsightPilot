/**
 * GitHub token management utilities
 */

/** Key for storing GitHub token in chrome storage */
const GITHUB_TOKEN_KEY = 'github_token';

/**
 * Save GitHub token to chrome storage
 * @param token GitHub token to save
 * @returns Promise resolving when token is saved
 */
export const saveGithubToken = async (token: string): Promise<void> => {
  if (typeof token !== 'string') {
    throw new TypeError('GitHub token must be a string');
  }

  try {
    await chrome.storage.sync.set({ [GITHUB_TOKEN_KEY]: token });
  } catch (error) {
    console.error('Error saving GitHub token:', error);
    throw error;
  }
};

/**
 * Get GitHub token from chrome storage
 * @returns Promise resolving to GitHub token or null if not found
 */
export const getGithubToken = async (): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get(GITHUB_TOKEN_KEY);
    return result[GITHUB_TOKEN_KEY] || null;
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
};

/**
 * Remove GitHub token from chrome storage
 * @returns Promise resolving when token is removed
 */
export const removeGithubToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove(GITHUB_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing GitHub token:', error);
    throw error;
  }
};
