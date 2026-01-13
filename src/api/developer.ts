import { getMetricByName } from './common';

/**
 * Metric names and their implementation names in OpenDigger
 */
export const metricNameMap = new Map<string, string>([
  ['activity', 'activity'],
  ['openrank', 'openrank'],
  ['developer_network', 'developer_network'],
  ['repo_network', 'repo_network'],
]);

/**
 * Developer metrics API functions
 */
export const developerMetrics = {
  /**
   * Get activity data for a developer
   * @param platform Platform name (github/gitee)
   * @param user Developer username
   * @returns Activity data
   */
  activity: (platform: string, user: string) => getMetricByName(platform, user, metricNameMap, 'activity'),

  /**
   * Get OpenRank data for a developer
   * @param platform Platform name (github/gitee)
   * @param user Developer username
   * @returns OpenRank data
   */
  openrank: (platform: string, user: string) => getMetricByName(platform, user, metricNameMap, 'openrank'),

  /**
   * Get developer network data
   * @param platform Platform name (github/gitee)
   * @param user Developer username
   * @returns Developer network data
   */
  developerNetwork: (platform: string, user: string) =>
    getMetricByName(platform, user, metricNameMap, 'developer_network'),

  /**
   * Get repo network data for a developer
   * @param platform Platform name (github/gitee)
   * @param user Developer username
   * @returns Repo network data
   */
  repoNetwork: (platform: string, user: string) => getMetricByName(platform, user, metricNameMap, 'repo_network'),
};

// Backward compatibility exports
export const getActivity = developerMetrics.activity;
export const getOpenrank = developerMetrics.openrank;
export const getDeveloperNetwork = developerMetrics.developerNetwork;
export const getRepoNetwork = developerMetrics.repoNetwork;
