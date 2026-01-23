/**
 * 输入验证函数
 */

/**
 * 验证仓库名称格式
 */
export function validateRepoName(repo: string | null | undefined): boolean {
  if (!repo || typeof repo !== 'string') return false;
  // 基本格式：owner/repo
  return /^[\w.-]+\/[\w.-]+$/.test(repo.trim());
}

/**
 * 验证数据是否有效
 */
export function validateData(data: any): boolean {
  if (!data) return false;
  // 检查是否为对象或数组
  return typeof data === 'object' || Array.isArray(data);
}

/**
 * 验证时间序列数据
 */
export function validateTimeSeriesData(data: any): boolean {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  // 检查每个元素是否为 [string, number] 格式
  return data.every(
    (item) =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === 'string' &&
      /^\d{4}-\d{2}$/.test(item[0]) &&
      (typeof item[1] === 'number' || item[1] === null)
  );
}

/**
 * 获取安全的仓库名称，如果无效则抛出错误
 */
export function getValidatedRepoName(repo: string | null | undefined): string {
  if (!validateRepoName(repo)) {
    throw new Error('无效的仓库名称格式');
  }
  return repo!.trim();
}

/**
 * 验证并获取默认值
 */
export function getValidatedValue<T>(value: T | null | undefined, defaultValue: T): T {
  return value !== null && value !== undefined ? value : defaultValue;
}

