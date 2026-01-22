/**
 * 数据验证工具函数
 */

import type { TimeSeriesData, SeriesData } from '../pages/ContentScripts/features/report-generator/types';

/**
 * 验证时间序列数据格式
 */
export function validateTimeSeriesData(data: unknown): data is TimeSeriesData {
  if (!Array.isArray(data)) return false;
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
 * 验证系列数据格式
 */
export function validateSeriesData(data: unknown): data is SeriesData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.values(data).every((value) => typeof value === 'number' || value === null);
}

/**
 * 验证月份字符串格式
 */
export function validateMonthString(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

/**
 * 获取安全的数值，提供默认值
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
}

/**
 * 验证季度数据范围
 */
export function validateQuarterRange(year: number, quarter: number): boolean {
  return (
    typeof year === 'number' &&
    !isNaN(year) &&
    year > 2000 &&
    year < 2100 &&
    typeof quarter === 'number' &&
    !isNaN(quarter) &&
    quarter >= 1 &&
    quarter <= 4
  );
}

