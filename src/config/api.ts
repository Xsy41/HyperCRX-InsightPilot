// API 配置常量

/**
 * 后端 API 基础 URL
 * 注意：在生产环境中应该从环境变量读取
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  REPORT: `${API_BASE_URL}/api/report`,
  ANALYZE: `${API_BASE_URL}/api/analyze`,
  OPENRANK_AI: `${API_BASE_URL}/api/openrank-ai`,
  STAR_AI: `${API_BASE_URL}/api/star-ai`,
  OSS_GPT_CHAT: `${API_BASE_URL}/api/oss-gpt-chat`,
  ISSUE_TREND_AI: `${API_BASE_URL}/api/issue-trend-ai`,
  ACTIVITY_TREND_AI: `${API_BASE_URL}/api/activity-trend-ai`,
} as const;

/**
 * API 请求超时时间（毫秒）
 */
export const API_TIMEOUT = 30000; // 30秒

