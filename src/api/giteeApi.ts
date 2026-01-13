import { getGiteeToken, saveGiteeToken, removeGiteeToken } from '../helpers/gitee-token';

/**
 * Gitee API request options
 */
export interface GiteeRequestOptions extends RequestInit {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Response type to return */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
}

/**
 * Make a request to the Gitee API
 * @param endpoint API endpoint path (without base URL)
 * @param options Request options
 * @returns Response data based on responseType, null if unauthorized or request failed
 */
export const giteeRequest = async <T = any>(endpoint: string, options: GiteeRequestOptions = {}): Promise<T | null> => {
  const token = await getGiteeToken();
  if (!token) {
    return null;
  }

  const {
    timeout = 30000, // Default timeout: 30 seconds
    responseType = 'json',
    ...fetchOptions
  } = options;

  // Gitee API base URL
  const baseUrl = 'https://gitee.com/api/v5';
  const url = `${baseUrl}/${endpoint}`;

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gitee API request timed out after ${timeout}ms`));
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
      console.error(`Gitee API Error: ${response.status} ${response.statusText}`, {
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
    console.error('Gitee API Request Failed:', error, {
      endpoint,
      options: fetchOptions,
    });
    return null;
  }
};

/**
 * Gitee token management functions
 */
export { saveGiteeToken, getGiteeToken, removeGiteeToken };
