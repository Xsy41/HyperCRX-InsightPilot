/**
 * GitHub token management utilities
 * Handles storage, retrieval, and caching of GitHub access tokens
 * @zh-CN GitHub令牌管理工具
 *        处理GitHub访问令牌的存储、检索和缓存
 */

/** Key for storing GitHub token in chrome storage */
const GITHUB_TOKEN_KEY = 'github_token';

/** Key for storing GitHub token expiration info */
const GITHUB_TOKEN_EXPIRES_KEY = 'github_token_expires_at';

/** Key for storing GitHub token scope info */
const GITHUB_TOKEN_SCOPE_KEY = 'github_token_scope';

/** Token change callback type */
export type GithubTokenChangeCallback = (token: string | null) => void;

/** GitHub token information interface */
export interface GithubTokenInfo {
  /** GitHub access token */
  token: string;
  /** Token expiration timestamp in milliseconds, or null if never expires */
  expiresAt: number | null;
  /** Token scope string */
  scope: string;
}

/** Cached GitHub token to avoid repeated storage reads */
let cachedGithubToken: string | null = null;

/** Cached GitHub token expiration info */
let cachedGithubTokenExpires: number | null = null;

/** Cached GitHub token scope info */
let cachedGithubTokenScope: string | null = null;

/** Token change listeners */
let tokenChangeListeners: GithubTokenChangeCallback[] = [];

/**
 * Check if a value is a valid non-empty string
 * @param value Value to check
 * @returns True if value is a valid non-empty string, false otherwise
 */
const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Check if a value is a valid timestamp number
 * @param value Value to check
 * @returns True if value is a valid timestamp number, false otherwise
 */
const isValidTimestamp = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0;
};

/**
 * Notify all token change listeners
 * @param newToken New token value
 */
const notifyTokenChangeListeners = (newToken: string | null): void => {
  tokenChangeListeners.forEach((listener) => {
    try {
      listener(newToken);
    } catch (error) {
      console.error('Error in token change listener:', error);
    }
  });
};

/**
 * Save GitHub token to chrome storage and update cache
 * @param token GitHub token to save
 * @param options Additional token options
 * @returns Promise resolving when token is saved
 * @throws TypeError if token is not a valid string
 */
export const saveGithubToken = async (
  token: string,
  options: { expiresAt?: number | null; scope?: string } = {}
): Promise<void> => {
  // Validate input parameter
  if (!isValidString(token)) {
    throw new TypeError('GitHub token must be a non-empty string');
  }

  try {
    const { expiresAt = null, scope = '' } = options;
    const storageData: Record<string, any> = {
      [GITHUB_TOKEN_KEY]: token,
    };

    // Only store expiration if it's a valid timestamp
    if (expiresAt !== null) {
      if (isValidTimestamp(expiresAt)) {
        storageData[GITHUB_TOKEN_EXPIRES_KEY] = expiresAt;
      } else {
        throw new TypeError('expiresAt must be a valid timestamp number or null');
      }
    } else {
      // Remove expiration if explicitly null
      storageData[GITHUB_TOKEN_EXPIRES_KEY] = null;
    }

    // Store scope if provided
    if (isValidString(scope)) {
      storageData[GITHUB_TOKEN_SCOPE_KEY] = scope;
    }

    await chrome.storage.sync.set(storageData);

    // Update cache
    cachedGithubToken = token;
    cachedGithubTokenExpires = expiresAt;
    cachedGithubTokenScope = scope;

    // Notify listeners
    notifyTokenChangeListeners(token);
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
      // Check if cached token is expired
      if (cachedGithubTokenExpires !== null && Date.now() > cachedGithubTokenExpires) {
        // Token expired, clear cache and return null
        await removeGithubToken();
        return null;
      }
      return cachedGithubToken;
    }

    // Read from storage
    const result = await chrome.storage.sync.get([GITHUB_TOKEN_KEY, GITHUB_TOKEN_EXPIRES_KEY, GITHUB_TOKEN_SCOPE_KEY]);

    const token = result[GITHUB_TOKEN_KEY];
    const expiresAt = result[GITHUB_TOKEN_EXPIRES_KEY];
    const scope = result[GITHUB_TOKEN_SCOPE_KEY];

    // Validate token format
    if (!isValidString(token)) {
      return null;
    }

    // Check if token is expired
    if (isValidTimestamp(expiresAt) && Date.now() > expiresAt) {
      // Token expired, remove it and return null
      await removeGithubToken();
      return null;
    }

    // Update cache
    cachedGithubToken = token;
    cachedGithubTokenExpires = isValidTimestamp(expiresAt) ? expiresAt : null;
    cachedGithubTokenScope = isValidString(scope) ? scope : '';

    return token;
  } catch (error) {
    console.error('Error getting GitHub token:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Get detailed GitHub token information
 * @returns Promise resolving to GitHub token info or null if not found
 */
export const getGithubTokenInfo = async (): Promise<GithubTokenInfo | null> => {
  try {
    const token = await getGithubToken();
    if (!token) {
      return null;
    }

    // If we have a valid token, we should have cached expiration and scope
    return {
      token,
      expiresAt: cachedGithubTokenExpires,
      scope: cachedGithubTokenScope || '',
    };
  } catch (error) {
    console.error('Error getting GitHub token info:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Remove GitHub token from chrome storage and clear cache
 * @returns Promise resolving when token is removed
 */
export const removeGithubToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove([GITHUB_TOKEN_KEY, GITHUB_TOKEN_EXPIRES_KEY, GITHUB_TOKEN_SCOPE_KEY]);

    // Clear cache
    const oldToken = cachedGithubToken;
    cachedGithubToken = null;
    cachedGithubTokenExpires = null;
    cachedGithubTokenScope = null;

    // Notify listeners if token changed
    if (oldToken !== null) {
      notifyTokenChangeListeners(null);
    }
  } catch (error) {
    console.error('Error removing GitHub token:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Check if GitHub token exists and is not expired
 * @returns Promise resolving to true if token exists and is valid, false otherwise
 */
export const hasValidGithubToken = async (): Promise<boolean> => {
  const token = await getGithubToken();
  return token !== null;
};

/**
 * Check if GitHub token is expired
 * @returns Promise resolving to true if token is expired, false otherwise
 */
export const isGithubTokenExpired = async (): Promise<boolean> => {
  try {
    // Check cache first
    if (cachedGithubTokenExpires !== null) {
      return Date.now() > cachedGithubTokenExpires;
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITHUB_TOKEN_EXPIRES_KEY);
    const expiresAt = result[GITHUB_TOKEN_EXPIRES_KEY];

    return isValidTimestamp(expiresAt) && Date.now() > expiresAt;
  } catch (error) {
    console.error('Error checking GitHub token expiration:', error instanceof Error ? error.message : String(error));
    return true;
  }
};

/**
 * Get GitHub token scope
 * @returns Promise resolving to token scope string, or empty string if not found
 */
export const getGithubTokenScope = async (): Promise<string> => {
  try {
    // Check cache first
    if (cachedGithubTokenScope !== null) {
      return cachedGithubTokenScope;
    }

    // Read from storage
    const result = await chrome.storage.sync.get(GITHUB_TOKEN_SCOPE_KEY);
    const scope = result[GITHUB_TOKEN_SCOPE_KEY];

    // Update cache
    const validScope = isValidString(scope) ? scope : '';
    cachedGithubTokenScope = validScope;

    return validScope;
  } catch (error) {
    console.error('Error getting GitHub token scope:', error instanceof Error ? error.message : String(error));
    return '';
  }
};

/**
 * Check if GitHub token has a specific scope
 * @param scope Scope to check for
 * @returns Promise resolving to true if token has the scope, false otherwise
 */
export const hasGithubTokenScope = async (scope: string): Promise<boolean> => {
  if (!isValidString(scope)) {
    return false;
  }

  const tokenScope = await getGithubTokenScope();
  if (!tokenScope) {
    return false;
  }

  // Check if scope is present in the token's scope string
  return tokenScope.split(' ').some((s) => s.trim() === scope.trim());
};

/**
 * Add a token change listener
 * @param callback Function to call when token changes
 * @returns Function to remove the listener
 */
export const addGithubTokenChangeListener = (callback: GithubTokenChangeCallback): (() => void) => {
  tokenChangeListeners.push(callback);

  // Return cleanup function
  return () => {
    tokenChangeListeners = tokenChangeListeners.filter((listener) => listener !== callback);
  };
};

/**
 * Clear all token change listeners
 */
export const clearGithubTokenChangeListeners = (): void => {
  tokenChangeListeners = [];
};

/**
 * Clear the cached GitHub token
 * Useful for testing or when manual refresh is needed
 */
export const clearGithubTokenCache = (): void => {
  const oldToken = cachedGithubToken;

  // Clear cache
  cachedGithubToken = null;
  cachedGithubTokenExpires = null;
  cachedGithubTokenScope = null;

  // Notify listeners if token was in cache
  if (oldToken !== null) {
    // Get fresh token from storage to notify listeners
    getGithubToken().then((newToken) => {
      notifyTokenChangeListeners(newToken);
    });
  }
};
