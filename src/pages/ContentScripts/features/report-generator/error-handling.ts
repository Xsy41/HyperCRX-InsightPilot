/**
 * 错误处理辅助函数
 */

export interface AppError {
  message: string;
  code?: string;
  originalError?: unknown;
}

/**
 * 创建应用错误对象
 */
export function createAppError(message: string, code?: string, originalError?: unknown): AppError {
  return {
    message,
    code,
    originalError,
  };
}

/**
 * 处理API错误
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof Error) {
    return createAppError(error.message, 'API_ERROR', error);
  }
  return createAppError('未知的API错误', 'UNKNOWN_ERROR', error);
}

/**
 * 处理数据验证错误
 */
export function handleValidationError(message: string): AppError {
  return createAppError(message, 'VALIDATION_ERROR');
}

/**
 * 安全执行异步操作，返回错误而不是抛出
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  onError?: (error: AppError) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = handleApiError(error);
    if (onError) {
      onError(appError);
    }
    return defaultValue;
  }
}

/**
 * 错误消息格式化
 */
export function formatErrorMessage(error: AppError): string {
  if (error.code === 'VALIDATION_ERROR') {
    return `验证错误: ${error.message}`;
  }
  if (error.code === 'API_ERROR') {
    return `API错误: ${error.message}`;
  }
  return error.message;
}

