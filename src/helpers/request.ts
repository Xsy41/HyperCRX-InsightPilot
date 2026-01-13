/**
 * Network request utility with advanced features
 * @zh-CN 高级网络请求工具
 */

/**
 * Response type options for network requests
 */
export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';

/**
 * Request options interface extending native RequestInit
 */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'headers' | 'body'> {
  /** HTTP request method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body - will be automatically JSON stringified if it's an object */
  body?: any;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 0 - no retries) */
  retry?: number;
  /** Base delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Response data type to expect (default: 'json') */
  responseType?: ResponseType;
  /** Whether to automatically stringify JSON bodies (default: true) */
  stringifyJsonBody?: boolean;
  /** AbortController signal for canceling requests */
  signal?: AbortSignal;
}

/**
 * Request error type with additional context
 */
export interface RequestError extends Error {
  /** HTTP status code if available */
  status?: number;
  /** Number of retry attempts made */
  retryAttempts?: number;
  /** Original error if this is a wrapper */
  originalError?: Error;
  /** Request URL */
  url?: string;
  /** Request method */
  method?: string;
}

/**
 * Advanced network request function with retry, timeout, and cancellation support
 * @template T - Expected response type
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise resolving to the response data of type T
 * @throws RequestError if the request fails
 */
export const request = async <T = any>(url: string, options: RequestOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    responseType = 'json',
    stringifyJsonBody = true,
    signal,
    ...restOptions
  } = options;

  // Create a new AbortController if none provided
  const controller = signal ? undefined : new AbortController();
  const requestSignal = signal || controller?.signal;

  // Prepare request body
  let requestBody: BodyInit | undefined;
  let requestHeaders = { ...headers };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || typeof body === 'string') {
      // Body is already in a valid format, no need to stringify
      requestBody = body;
    } else if (stringifyJsonBody) {
      // Automatically stringify JSON bodies
      requestBody = JSON.stringify(body);
      // Only add Content-Type if not already present and we're sending JSON
      if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    } else {
      requestBody = body as BodyInit;
    }
  }

  // Timeout promise creator
  const timeoutPromise = (ms: number): Promise<never> => {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        // Abort the request if we created the controller
        controller?.abort();
        const error: RequestError = new Error(`Request timed out after ${ms}ms`);
        error.url = url;
        error.method = method;
        reject(error);
      }, ms);

      // Clean up timeout if request completes/cancels
      requestSignal?.addEventListener('abort', () => clearTimeout(timeoutId));
    });
  };

  // Build request config
  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal: requestSignal,
    ...restOptions,
  };

  let attempt = 0;
  let lastError: RequestError;

  while (attempt <= retry) {
    try {
      attempt++;

      console.debug(`Request attempt ${attempt}/${retry + 1}: ${method} ${url}`);

      const response = await Promise.race([fetch(url, requestConfig), timeoutPromise(timeout)]);

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}, url: ${url}`;
        const error: RequestError = new Error(errorMessage);
        error.status = response.status;
        error.url = url;
        error.method = method;
        error.retryAttempts = attempt - 1;
        throw error;
      }

      // Handle response based on expected response type
      let responseData: any;
      switch (responseType) {
        case 'json':
          responseData = await response.json();
          break;
        case 'text':
          responseData = await response.text();
          break;
        case 'blob':
          responseData = await response.blob();
          break;
        case 'arrayBuffer':
          responseData = await response.arrayBuffer();
          break;
        case 'formData':
          responseData = await response.formData();
          break;
        default:
          responseData = await response.json();
      }

      console.debug(`Request successful: ${method} ${url}`, responseData);
      return responseData as T;
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === 'AbortError';

      // Don't retry on abort errors
      if (isAbortError) {
        throw error;
      }

      // Wrap error with request context
      const requestError: RequestError = error instanceof Error ? error : new Error(`Request failed: ${String(error)}`);

      // Add request context
      if (!requestError.url) {
        requestError.url = url;
        requestError.method = method;
      }

      requestError.retryAttempts = attempt - 1;

      // Check if we should retry
      if (attempt <= retry) {
        // Calculate exponential backoff with jitter
        const backoffDelay = Math.min(
          retryDelay * Math.pow(2, attempt - 1) + Math.random() * 100,
          30000 // Cap at 30 seconds
        );

        console.debug(`Request failed, retrying in ${Math.round(backoffDelay)}ms: ${method} ${url}`, requestError);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      } else {
        console.error(`Request failed after ${attempt} attempts: ${method} ${url}`, requestError);
        throw requestError;
      }

      lastError = requestError;
    }
  }

  throw lastError;
};

/**
 * Create a cancelable request wrapper
 * @returns Object with request function and cancel method
 */
export const createCancelableRequest = () => {
  let controller: AbortController | null = null;

  const cancelableRequest = <T = any>(url: string, options: RequestOptions = {}): Promise<T> => {
    // Cancel any pending request
    if (controller) {
      controller.abort();
    }

    // Create new controller for this request
    controller = new AbortController();

    return request<T>(url, {
      ...options,
      signal: controller.signal,
    });
  };

  const cancel = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return {
    request: cancelableRequest,
    cancel,
  };
};

export default request;
