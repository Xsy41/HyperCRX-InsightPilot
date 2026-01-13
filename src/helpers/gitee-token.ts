/**
 * Gitee token management utilities
 * Handles storage, retrieval, and automatic refresh of Gitee access tokens
 */

/** Key for storing Gitee token in chrome storage */
const GITEE_TOKEN_KEY = 'gitee_token';

/** Refresh token endpoint URL */
const GITEE_REFRESH_TOKEN_URL = 'https://gitee.com/oauth/token';

/** Default request timeout in milliseconds */
const REQUEST_TIMEOUT = 10000;

/** Default retry attempts for token refresh */
const MAX_REFRESH_RETRIES = 2;

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
export interface GiteeTokenRefreshResponse {
  /** New access token */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** New refresh token */
  refresh_token: string;
  /** Token type (e.g., "bearer") */
  token_type?: string;
  /** Scope of the token */
  scope?: string;
}

/** Cached token information to avoid repeated storage reads */
let cachedTokenInfo: GiteeTokenInfo | null = null;

/** Flag to prevent concurrent refresh requests */
let isRefreshing = false;

/** Queue of promises waiting for token refresh to complete */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Check if a value is a valid non-empty string
 * @param value Value to check
 * @returns True if value is a valid non-empty string, false otherwise
 */
const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Check if a value is a valid timestamp (positive number)
 * @param value Value to check
 * @returns True if value is a valid timestamp, false otherwise
 */
const isValidTimestamp = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0;
};

/**
 * Fetch with timeout support
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeout Timeout in milliseconds
 * @returns Promise resolving to Response object
 * @throws Error if request times out
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Refresh Gitee token with retry logic
 * @param refreshToken Current refresh token
 * @param retryCount Current retry attempt count
 * @returns Promise resolving to new access token or null if refresh failed
 */
const refreshGiteeToken = async (refreshToken: string, retryCount: number = 0): Promise<string | null> => {
  if (retryCount >= MAX_REFRESH_RETRIES) {
    console.error(`Gitee token refresh failed after ${MAX_REFRESH_RETRIES} attempts`);
    return null;
  }

  try {
    const refreshReq = await fetchWithTimeout(
      GITEE_REFRESH_TOKEN_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
      REQUEST_TIMEOUT
    );

    if (!refreshReq.ok) {
      const errorText = await refreshReq.text().catch(() => refreshReq.statusText);
      console.error(`Gitee token refresh request failed (${refreshReq.status}): ${errorText}`);

      // Retry if it's a server error or timeout
      if ([500, 502, 503, 504].includes(refreshReq.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount))); // Exponential backoff
        return refreshGiteeToken(refreshToken, retryCount + 1);
      }
      return null;
    }

    const refreshData = (await refreshReq.json()) as GiteeTokenRefreshResponse;

    if (!refreshData || !isValidString(refreshData.access_token)) {
      console.error('Gitee token refresh response invalid:', refreshData);
      return null;
    }

    // Calculate safe expiration time (subtract 2 minutes buffer)
    const safeExpireTime = Date.now() + (refreshData.expires_in - 120) * 1000;

    // Save new token information
    await saveGiteeToken(refreshData.access_token, safeExpireTime, refreshData.refresh_token);

    return refreshData.access_token;
  } catch (error) {
    console.error(
      `Error refreshing Gitee token (attempt ${retryCount + 1}):`,
      error instanceof Error ? error.message : String(error)
    );

    // Retry on network errors or timeouts
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TypeError')) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount))); // Exponential backoff
      return refreshGiteeToken(refreshToken, retryCount + 1);
    }

    return null;
  }
};

/**
 * Save Gitee token to chrome storage and update cache
 * @param token Access token
 * @param expireAt Token expiration timestamp in milliseconds
 * @param refreshToken Refresh token
 * @returns Promise resolving when token is saved
 * @throws TypeError if parameters are invalid
 */
export const saveGiteeToken = async (token: string, expireAt: number, refreshToken: string): Promise<void> => {
  // Validate input parameters
  if (!isValidString(token)) {
    throw new TypeError('Invalid token: must be a non-empty string');
  }

  if (!isValidTimestamp(expireAt)) {
    throw new TypeError('Invalid expireAt: must be a positive number (timestamp in milliseconds)');
  }

  if (!isValidString(refreshToken)) {
    throw new TypeError('Invalid refreshToken: must be a non-empty string');
  }

  const tokenInfo: GiteeTokenInfo = {
    token,
    expireAt,
    refreshToken,
  };

  try {
    await chrome.storage.sync.set({
      [GITEE_TOKEN_KEY]: tokenInfo,
    });

    // Update cache
    cachedTokenInfo = tokenInfo;
  } catch (error) {
    console.error('Error saving Gitee token to storage:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Get Gitee token from cache or storage, automatically refreshing if expired
 * @returns Promise resolving to Gitee token or null if not found or refresh failed
 */
export const getGiteeToken = async (): Promise<string | null> => {
  try {
    // Check if token is being refreshed
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    // Check cache first
    if (cachedTokenInfo) {
      // Check if cached token is still valid
      if (cachedTokenInfo.expireAt > Date.now()) {
        return cachedTokenInfo.token;
      }
      // Token expired, clear cache
      cachedTokenInfo = null;
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITEE_TOKEN_KEY);
    if (!result || !result[GITEE_TOKEN_KEY]) {
      return null;
    }

    const tokenInfo = result[GITEE_TOKEN_KEY] as GiteeTokenInfo;

    // Validate token info structure
    if (
      !isValidString(tokenInfo.token) ||
      !isValidTimestamp(tokenInfo.expireAt) ||
      !isValidString(tokenInfo.refreshToken)
    ) {
      console.error('Invalid Gitee token info in storage:', tokenInfo);
      return null;
    }

    // Check if token is expired
    if (tokenInfo.expireAt > Date.now()) {
      // Update cache and return
      cachedTokenInfo = tokenInfo;
      return tokenInfo.token;
    }

    console.log('Gitee token expired, refreshing...');

    // Set refresh in progress flag
    isRefreshing = true;

    // Create refresh promise to share with concurrent requests
    refreshPromise = refreshGiteeToken(tokenInfo.refreshToken);

    try {
      const newToken = await refreshPromise;
      return newToken;
    } finally {
      // Reset refresh flags
      isRefreshing = false;
      refreshPromise = null;
    }
  } catch (error) {
    console.error('Error getting Gitee token:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Remove Gitee token from chrome storage and clear cache
 * @returns Promise resolving when token is removed
 */
export const removeGiteeToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove(GITEE_TOKEN_KEY);
    // Clear cache
    cachedTokenInfo = null;
  } catch (error) {
    console.error('Error removing Gitee token:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Get full Gitee token information from cache or storage
 * @returns Promise resolving to Gitee token info or null if not found
 */
export const getGiteeTokenInfo = async (): Promise<GiteeTokenInfo | null> => {
  try {
    // Check cache first
    if (cachedTokenInfo) {
      return cachedTokenInfo;
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITEE_TOKEN_KEY);
    const tokenInfo = result[GITEE_TOKEN_KEY] as GiteeTokenInfo;

    if (!tokenInfo) {
      return null;
    }

    // Validate token info structure
    if (
      !isValidString(tokenInfo.token) ||
      !isValidTimestamp(tokenInfo.expireAt) ||
      !isValidString(tokenInfo.refreshToken)
    ) {
      console.error('Invalid Gitee token info in storage:', tokenInfo);
      return null;
    }

    // Update cache
    cachedTokenInfo = tokenInfo;
    return tokenInfo;
  } catch (error) {
    console.error('Error getting Gitee token info:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Clear cached token information
 * Useful for testing or when manual refresh is needed
 */
export const clearTokenCache = (): void => {
  cachedTokenInfo = null;
};
