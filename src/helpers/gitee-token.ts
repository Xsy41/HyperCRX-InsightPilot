/**
 * Gitee token management utilities
 */

/** Key for storing Gitee token in chrome storage */
const GITEE_TOKEN_KEY = 'gitee_token';

/** Gitee token information interface */
export interface GiteeTokenInfo {
  /** Access token */
  token: string;
  /** Token expiration timestamp in milliseconds */
  expireAt: number;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
}

/** Gitee token refresh response interface */
interface GiteeTokenRefreshResponse {
  /** New access token */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** New refresh token */
  refresh_token: string;
}

/**
 * Save Gitee token to chrome storage
 * @param token Access token
 * @param expireAt Token expiration timestamp in milliseconds
 * @param refreshToken Refresh token
 * @returns Promise resolving when token is saved
 */
export const saveGiteeToken = async (token: string, expireAt: number, refreshToken: string): Promise<void> => {
  if (typeof token !== 'string' || typeof expireAt !== 'number' || typeof refreshToken !== 'string') {
    throw new TypeError('Invalid parameters: token and refreshToken must be strings, expireAt must be a number');
  }

  try {
    await chrome.storage.sync.set({
      [GITEE_TOKEN_KEY]: {
        token,
        expireAt,
        refreshToken,
      } as GiteeTokenInfo,
    });
  } catch (error) {
    console.error('Error saving Gitee token:', error);
    throw error;
  }
};

/**
 * Get Gitee token from chrome storage, automatically refreshing if expired
 * @returns Promise resolving to Gitee token or null if not found or refresh failed
 */
export const getGiteeToken = async (): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get(GITEE_TOKEN_KEY);
    if (!result || !result[GITEE_TOKEN_KEY]) {
      return null;
    }

    const tokenInfo = result[GITEE_TOKEN_KEY] as GiteeTokenInfo;

    // Check if token is expired
    if (!tokenInfo.expireAt || tokenInfo.expireAt > Date.now()) {
      return tokenInfo.token || null;
    }

    console.log('Gitee token expired, refreshing...');

    // Refresh expired token
    const refreshReq = await fetch('https://gitee.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenInfo.refreshToken,
      }),
    });

    if (!refreshReq.ok) {
      console.error('Gitee token refresh request failed:', refreshReq.statusText);
      return null;
    }

    const refreshData = (await refreshReq.json()) as GiteeTokenRefreshResponse;

    if (!refreshData || !refreshData.access_token) {
      console.error('Gitee token refresh response invalid:', refreshData);
      return null;
    }

    // Save new token information
    await saveGiteeToken(
      refreshData.access_token,
      Date.now() + (refreshData.expires_in - 120) * 1000, // Subtract 2 minutes to be safe
      refreshData.refresh_token
    );

    return refreshData.access_token;
  } catch (error) {
    console.error('Error getting Gitee token:', error);
    return null;
  }
};

/**
 * Remove Gitee token from chrome storage
 * @returns Promise resolving when token is removed
 */
export const removeGiteeToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove(GITEE_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing Gitee token:', error);
    throw error;
  }
};

/**
 * Get full Gitee token information from storage
 * @returns Promise resolving to Gitee token info or null if not found
 */
export const getGiteeTokenInfo = async (): Promise<GiteeTokenInfo | null> => {
  try {
    const result = await chrome.storage.sync.get(GITEE_TOKEN_KEY);
    return result[GITEE_TOKEN_KEY] || null;
  } catch (error) {
    console.error('Error getting Gitee token info:', error);
    return null;
  }
};
