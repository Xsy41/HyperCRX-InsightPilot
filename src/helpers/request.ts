/**
 * @zh-CN 处理网络请求
 * @en-US network request
 */
interface RequestOptions extends RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
}

const request = async (url: string, options: RequestOptions = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    responseType = 'json',
    ...restOptions
  } = options;

  // 处理请求体，自动转换为JSON
  const requestBody = body ? JSON.stringify(body) : undefined;

  // 添加默认的Content-Type头
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 超时处理函数
  const timeoutPromise = (ms: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${ms}ms`));
      }, ms);
    });
  };

  let attempt = 0;
  let lastError: Error;

  while (attempt <= retry) {
    try {
      attempt++;

      const response = await Promise.race([
        fetch(url, {
          method,
          headers: requestHeaders,
          body: requestBody,
          ...restOptions,
        }),
        timeoutPromise(timeout),
      ]);

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}, url: ${url}`;
        const error = new Error(errorMessage);
        Object.assign(error, { status: response.status });
        throw error;
      }

      // 根据responseType处理响应
      switch (responseType) {
        case 'json':
          return await response.json();
        case 'text':
          return await response.text();
        case 'blob':
          return await response.blob();
        case 'arrayBuffer':
          return await response.arrayBuffer();
        case 'formData':
          return await response.formData();
        default:
          return await response.json();
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Request failed: ${String(error)}`);

      // 如果还有重试次数，等待后继续尝试
      if (attempt <= retry) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
};

export default request;
