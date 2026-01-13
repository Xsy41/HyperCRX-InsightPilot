/**
 * GitHub token management utilities
 * Handles storage, retrieval, and caching of GitHub access tokens
 */

/** Key for storing GitHub token in chrome storage */
const GITHUB_TOKEN_KEY = 'github_token';

/** Cached GitHub token to avoid repeated storage reads */
let cachedGithubToken: string | null = null;

/**
 * Check if a value is a valid non-empty string
 * @param value Value to check
 * @returns True if value is a valid non-empty string, false otherwise
 */
const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Save GitHub token to chrome storage and update cache
 * @param token GitHub token to save
 * @returns Promise resolving when token is saved
 * @throws TypeError if token is not a valid string
 */
export const saveGithubToken = async (token: string): Promise<void> => {
  // Validate input parameter
  if (!isValidString(token)) {
    throw new TypeError('GitHub token must be a non-empty string');
  }

  try {
    await chrome.storage.sync.set({ [GITHUB_TOKEN_KEY]: token });
    // Update cache
    cachedGithubToken = token;
  } catch (error) {
    console.error('Error saving GitHub token to storage:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Get GitHub token from cache or storage
 * @returns Promise resolving to GitHub token or null if not found
 */
export const getGithubToken = async (): Promise<string | null> => {
  try {
    // Check cache first
    if (cachedGithubToken !== null) {
      return cachedGithubToken;
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITHUB_TOKEN_KEY);
    const token = result[GITHUB_TOKEN_KEY];

    // Validate token format
    const validToken = isValidString(token) ? token : null;

    // Update cache
    cachedGithubToken = validToken;

    return validToken;
  } catch (error) {
    console.error('Error getting GitHub token:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Remove GitHub token from chrome storage and clear cache
 * @returns Promise resolving when token is removed
 */
export const removeGithubToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove(GITHUB_TOKEN_KEY);
    // Clear cache
    cachedGithubToken = null;
  } catch (error) {
    console.error('Error removing GitHub token:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Clear the cached GitHub token
 * Useful for testing or when manual refresh is needed
 */
export const clearGithubTokenCache = (): void => {
  cachedGithubToken = null;
};
