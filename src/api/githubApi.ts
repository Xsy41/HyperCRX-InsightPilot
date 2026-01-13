import { getGithubToken, saveGithubToken, removeGithubToken } from '../helpers/github-token';

/**
 * GitHub API request options
 */
export interface GithubRequestOptions extends RequestInit {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Response type to return */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
}

/**
 * Make a request to the GitHub API
 * @param endpoint API endpoint path (without base URL)
 * @param options Request options
 * @returns Response data based on responseType, null if unauthorized or request failed
 */
export const githubRequest = async <T = any>(
  endpoint: string,
  options: GithubRequestOptions = {}
): Promise<T | null> => {
  const token = await getGithubToken();
  if (!token) {
    return null;
  }

  const {
    timeout = 30000, // Default timeout: 30 seconds
    responseType = 'json',
    ...fetchOptions
  } = options;

  // GitHub API base URL
  const baseUrl = 'https://api.github.com';
  const url = `${baseUrl}${endpoint}`;

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`GitHub API request timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      }),
      timeoutPromise,
    ]);

    if (!response.ok) {
      // Log detailed error information
      console.error(`GitHub API Error: ${response.status} ${response.statusText}`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    // Handle different response types
    switch (responseType) {
      case 'json':
        return response.json() as Promise<T>;
      case 'text':
        return response.text() as unknown as T;
      case 'blob':
        return response.blob() as unknown as T;
      case 'arrayBuffer':
        return response.arrayBuffer() as unknown as T;
      case 'formData':
        return response.formData() as unknown as T;
      default:
        return response.json() as Promise<T>;
    }
  } catch (error) {
    // Log error information
    console.error('GitHub API Request Failed:', error, {
      endpoint,
      options: fetchOptions,
    });
    return null;
  }
};

/**
 * GitHub token management functions
 */
export { saveGithubToken, getGithubToken, removeGithubToken };
