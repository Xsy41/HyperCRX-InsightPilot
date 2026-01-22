/**
 * 报告生成器常量配置
 */

// 趋势阈值
export const TREND_THRESHOLDS = {
  SIGNIFICANT_INCREASE: 20, // 显著上升阈值
  SIGNIFICANT_DECREASE: -20, // 显著下降阈值
  PR_RATE_SIGNIFICANT: 10, // PR合并率显著变化阈值
  PR_RATE_DECREASE: -10, // PR合并率下降阈值
  STAR_GROWTH_HIGH: 100, // Star高增长阈值
} as const;

// 趋势描述文本
export const TREND_DESCRIPTIONS = {
  SIGNIFICANT_UP: '显著上升',
  SLIGHT_UP: '小幅上升',
  SIGNIFICANT_DOWN: '显著下降',
  SLIGHT_DOWN: '略有下降',
  STABLE: '基本稳定',
} as const;

// PR合并率趋势描述
export const PR_RATE_DESCRIPTIONS = {
  EFFICIENCY_IMPROVED: '效率明显提升',
  SLIGHT_OPTIMIZATION: '略有优化',
  RATE_DECLINED: '合并率下滑限制协作',
  SLIGHT_DECLINE: '轻微下滑',
  FLAT: '持平',
} as const;

// Star变化描述
export const STAR_DELTA_DESCRIPTIONS = {
  HIGH_GROWTH: '大幅增长，或因近期更新/传播',
  SLIGHT_GROWTH: '小幅增长',
  DECLINE: '回落',
  NO_CHANGE: '无明显变化',
} as const;

// 图表配置
export const CHART_CONFIG = {
  WIDTH: 600,
  HEIGHT: 340,
  PREVIEW_MONTHS: 6,
  RENDER_DELAY: 350, // 毫秒
  RENDER_DELAY_LONG: 500, // 毫秒
} as const;

// API配置
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5001',
  TIMEOUT: 30000, // 30秒
} as const;

// 报告配置
export const REPORT_CONFIG = {
  MONTHS_TO_ANALYZE: 6, // 分析最近N个月
  TOP_CONTRIBUTORS: 3, // 显示Top N贡献者
} as const;

