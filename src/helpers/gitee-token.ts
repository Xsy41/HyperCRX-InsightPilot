/**
 * Gitee token management utilities
 * Handles storage, retrieval, and automatic refresh of Gitee access tokens
 * @zh-CN Gitee令牌管理工具
 *        处理Gitee访问令牌的存储、检索和自动刷新
 */

/** Key for storing Gitee token in chrome storage */
const GITEE_TOKEN_KEY = 'gitee_token';

/** Refresh token endpoint URL */
const GITEE_REFRESH_TOKEN_URL = 'https://gitee.com/oauth/token';

/** Default request timeout in milliseconds */
const REQUEST_TIMEOUT = 10000;

/** Default retry attempts for token refresh */
const MAX_REFRESH_RETRIES = 3;

/** Default retry delay in milliseconds */
const DEFAULT_RETRY_DELAY = 1000;

/** Token change callback type */
export type GiteeTokenChangeCallback = (token: string | null) => void;

/** Gitee token information interface */
export interface GiteeTokenInfo {
  /** Access token */
  token: string;
  /** Token expiration timestamp in milliseconds */
  expireAt: number;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Token scope information */
  scope?: string;
  /** Token type (e.g., "bearer") */
  tokenType?: string;
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

/** Token change listeners */
let tokenChangeListeners: GiteeTokenChangeCallback[] = [];

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
 * Notify all token change listeners
 * @param token New token value
 */
const notifyTokenChangeListeners = (token: string | null): void => {
  tokenChangeListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (error) {
      console.error('Error in Gitee token change listener:', error);
    }
  });
};

/**
 * Refresh Gitee token with retry logic and improved error handling
 * @param refreshToken Current refresh token
 * @param retryCount Current retry attempt count
 * @returns Promise resolving to new access token or null if refresh failed
 */
const refreshGiteeToken = async (refreshToken: string, retryCount: number = 0): Promise<string | null> => {
  if (retryCount >= MAX_REFRESH_RETRIES) {
    console.error(`Gitee token refresh failed after ${MAX_REFRESH_RETRIES} attempts`);
    // Remove token if refresh failed after max retries
    await removeGiteeToken();
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

      // Retry only on server errors (5xx) with exponential backoff
      if ([500, 502, 503, 504].includes(refreshReq.status)) {
        const backoffDelay = DEFAULT_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return refreshGiteeToken(refreshToken, retryCount + 1);
      }

      // For client errors (4xx), remove token since refresh is impossible
      await removeGiteeToken();
      return null;
    }

    const refreshData = (await refreshReq.json()) as GiteeTokenRefreshResponse;

    if (!refreshData || !isValidString(refreshData.access_token)) {
      console.error('Gitee token refresh response invalid:', refreshData);
      await removeGiteeToken();
      return null;
    }

    // Calculate safe expiration time (subtract 2 minutes buffer to avoid edge cases)
    const safeExpireTime = Date.now() + (refreshData.expires_in - 120) * 1000;

    // Save new token information with additional details
    await saveGiteeToken(refreshData.access_token, safeExpireTime, refreshData.refresh_token, {
      scope: refreshData.scope,
      tokenType: refreshData.token_type,
    });

    return refreshData.access_token;
  } catch (error) {
    console.error(
      `Error refreshing Gitee token (attempt ${retryCount + 1}):`,
      error instanceof Error ? error.message : String(error)
    );

    // Retry on network errors, timeouts, or abort errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('NetworkError'))
    ) {
      const backoffDelay = DEFAULT_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return refreshGiteeToken(refreshToken, retryCount + 1);
    }

    // For other errors, remove token and return null
    await removeGiteeToken();
    return null;
  }
};

/**
 * Save Gitee token to chrome storage and update cache
 * @param token Access token
 * @param expireAt Token expiration timestamp in milliseconds
 * @param refreshToken Refresh token
 * @param additionalInfo Additional token information
 * @returns Promise resolving when token is saved
 * @throws TypeError if parameters are invalid
 */
export const saveGiteeToken = async (
  token: string,
  expireAt: number,
  refreshToken: string,
  additionalInfo: { scope?: string; tokenType?: string } = {}
): Promise<void> => {
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
    scope: additionalInfo.scope,
    tokenType: additionalInfo.tokenType,
  };

  try {
    await chrome.storage.sync.set({
      [GITEE_TOKEN_KEY]: tokenInfo,
    });

    // Update cache
    const oldToken = cachedTokenInfo?.token || null;
    cachedTokenInfo = tokenInfo;

    // Notify listeners if token changed
    notifyTokenChangeListeners(token);
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
      // Check if cached token is still valid with a 5-second buffer
      if (cachedTokenInfo.expireAt > Date.now() + 5000) {
        return cachedTokenInfo.token;
      }
      // Token is about to expire or already expired, clear cache
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
      await removeGiteeToken();
      return null;
    }

    // Check if token is expired or about to expire (within 5 seconds)
    if (tokenInfo.expireAt > Date.now() + 5000) {
      // Update cache and return
      cachedTokenInfo = tokenInfo;
      return tokenInfo.token;
    }

    console.log('Gitee token expired or about to expire, refreshing...');

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
    const oldToken = cachedTokenInfo?.token || null;

    await chrome.storage.sync.remove(GITEE_TOKEN_KEY);

    // Clear cache
    cachedTokenInfo = null;

    // Notify listeners if token was removed
    if (oldToken !== null) {
      notifyTokenChangeListeners(null);
    }
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
      await removeGiteeToken();
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
 * Check if Gitee token exists and is valid
 * @returns Promise resolving to true if token exists and is valid, false otherwise
 */
export const hasValidGiteeToken = async (): Promise<boolean> => {
  const token = await getGiteeToken();
  return token !== null;
};

/**
 * Check if Gitee token is expired
 * @returns Promise resolving to true if token is expired, false otherwise
 */
export const isGiteeTokenExpired = async (): Promise<boolean> => {
  try {
    // Check cache first
    if (cachedTokenInfo) {
      return cachedTokenInfo.expireAt <= Date.now();
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITEE_TOKEN_KEY);
    const tokenInfo = result[GITEE_TOKEN_KEY] as GiteeTokenInfo;

    if (!tokenInfo) {
      return true;
    }

    // Validate token info structure
    if (
      !isValidString(tokenInfo.token) ||
      !isValidTimestamp(tokenInfo.expireAt) ||
      !isValidString(tokenInfo.refreshToken)
    ) {
      return true;
    }

    return tokenInfo.expireAt <= Date.now();
  } catch (error) {
    console.error('Error checking Gitee token expiration:', error instanceof Error ? error.message : String(error));
    return true;
  }
};

/**
 * Add a Gitee token change listener
 * @param callback Function to call when token changes
 * @returns Function to remove the listener
 */
export const addGiteeTokenChangeListener = (callback: GiteeTokenChangeCallback): (() => void) => {
  tokenChangeListeners.push(callback);

  // Return cleanup function
  return () => {
    tokenChangeListeners = tokenChangeListeners.filter((listener) => listener !== callback);
  };
};

/**
 * Clear all Gitee token change listeners
 */
export const clearGiteeTokenChangeListeners = (): void => {
  tokenChangeListeners = [];
};

/**
 * Clear cached token information
 * Useful for testing or when manual refresh is needed
 */
export const clearTokenCache = (): void => {
  const oldToken = cachedTokenInfo?.token || null;
  cachedTokenInfo = null;

  // Notify listeners if token was cleared from cache
  if (oldToken !== null) {
    // Get fresh token from storage to notify listeners
    getGiteeToken().then((newToken) => {
      notifyTokenChangeListeners(newToken);
    });
  }
};
