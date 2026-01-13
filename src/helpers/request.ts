/**
 * @zh-CN 处理网络请求
 * @en-US network request
 */
interface RequestOptions extends RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

const request = async (url: string, options: RequestOptions = {}) => {
  try {
    const { method = 'GET', headers = {}, body, ...restOptions } = options;

    // 处理请求体，自动转换为JSON
    const requestBody = body ? JSON.stringify(body) : undefined;

    // 添加默认的Content-Type头
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      ...restOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // 重新抛出错误，保留原始错误信息
    if (error instanceof Error) {
      throw error;
    }
    // 如果是其他类型的错误，包装成Error对象
    throw new Error(`Request failed: ${String(error)}`);
  }
};

export default request;
