/**
 * API 调用辅助函数
 */

const API_BASE_URL = 'http://localhost:5001';

/**
 * 统一的 API 调用函数，带错误处理
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error: ${String(error)}`);
  }
}

/**
 * 并行调用多个 API
 */
export async function parallelApiCalls<T extends Record<string, any>>(
  calls: Record<keyof T, () => Promise<any>>
): Promise<T> {
  const keys = Object.keys(calls) as Array<keyof T>;
  const promises = keys.map((key) => calls[key]());
  const results = await Promise.all(promises);
  
  return keys.reduce((acc, key, index) => {
    acc[key] = results[index];
    return acc;
  }, {} as T);
}

/**
 * 带重试的 API 调用
 */
export async function apiCallWithRetry<T = any>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall<T>(endpoint, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }
  
  throw lastError || new Error('API request failed after retries');
}

