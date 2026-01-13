/**
 * Error code constants for API responses
 */
export const ErrorCode = {
  /** Request successful */
  OK: 200,
  /** Resource not found */
  NOT_FOUND: 404,
  /** Unknown server error */
  UNKNOWN: 500,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * API and service endpoints
 */
export const Endpoints = {
  /** OSS XLAB endpoint for data storage */
  OSS_XLAB: process.env.OSS_XLAB_ENDPOINT || 'https://oss.open-digger.cn',
  /** URL for creating new issues in Hypertrons CRX repository */
  HYPERTRONS_CRX_NEW_ISSUE: 'https://github.com/hypertrons/hypertrons-crx/issues/new/choose',
  /** Hypercrx GitHub repository URL */
  HYPERCRX_GITHUB: 'https://github.com/hypertrons/hypertrons-crx',
  /** Fast PR configuration URL */
  FAST_PR_CONFIG: process.env.FAST_PR_CONFIG_URL || 'https://hypercrx.cn/configs/fast-pr-url-rules.cjs',
} as const;

export type EndpointKey = keyof typeof Endpoints;

export type EndpointValue = (typeof Endpoints)[EndpointKey];

/**
 * Application constants
 */
export const AppConstants = {
  /** Default cache duration in milliseconds (5 minutes) */
  DEFAULT_CACHE_DURATION: 5 * 60 * 1000,
  /** Maximum retry attempts for API requests */
  MAX_RETRY_ATTEMPTS: 3,
  /** Default retry delay in milliseconds */
  DEFAULT_RETRY_DELAY: 1000,
  /** Maximum timeout for API requests in milliseconds (30 seconds) */
  API_TIMEOUT: 30 * 1000,
} as const;
