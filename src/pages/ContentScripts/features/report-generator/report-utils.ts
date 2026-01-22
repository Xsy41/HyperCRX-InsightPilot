/**
 * 报告生成工具函数
 */

import type { LastTwoByMonthResult } from './types';

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * 获取趋势箭头
 */
export function getTrendArrow(value: number): string {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
}

/**
 * 获取趋势描述
 */
export function getTrendDescription(value: number): string {
  if (value > 20) return '大幅上升';
  if (value > 5) return '上升';
  if (value > -5) return '基本持平';
  if (value > -20) return '下降';
  return '大幅下降';
}

/**
 * 格式化指标信息用于报告
 */
export function formatMetricForReport(metric: LastTwoByMonthResult): {
  current: string;
  change: string;
  trend: string;
  description: string;
} {
  const arrow = getTrendArrow(metric.pct);
  const change = formatPercentage(metric.pct);
  const trend = getTrendDescription(metric.pct);
  
  return {
    current: metric.cur.toString(),
    change: `${arrow} ${change}`,
    trend,
    description: `${trend}，${change}`,
  };
}

/**
 * 计算指标变化百分比（安全版本，避免除以零）
 */
export function safeCalculatePercentage(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

