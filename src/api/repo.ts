import { getMetricByName } from './common';

/**
 * Metric names and their implementation names in OpenDigger
 */
export const metricNameMap = new Map<string, string>([
  ['activity', 'activity'],
  ['openrank', 'openrank'],
  ['participant', 'participants'],
  ['contributor', 'contributors'],
  ['forks', 'technical_fork'],
  ['stars', 'stars'],
  ['issues_opened', 'issues_new'],
  ['issues_closed', 'issues_closed'],
  ['issue_comments', 'issue_comments'],
  ['PR_opened', 'change_requests'],
  ['PR_merged', 'change_requests_accepted'],
  ['PR_reviews', 'change_requests_reviews'],
  ['merged_code_addition', 'code_change_lines_add'],
  ['merged_code_deletion', 'code_change_lines_remove'],
  ['merged_code_sum', 'code_change_lines_sum'],
  ['developer_network', 'developer_network'],
  ['repo_network', 'repo_network'],
  ['activity_details', 'activity_details'],
]);

/**
 * Repository metrics API functions
 */
export const repoMetrics = {
  /**
   * Get activity data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Activity data
   */
  activity: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'activity'),

  /**
   * Get OpenRank data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns OpenRank data
   */
  openrank: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'openrank'),

  /**
   * Get participant data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Participant data
   */
  participant: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'participant'),

  /**
   * Get contributor data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Contributor data
   */
  contributor: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'contributor'),

  /**
   * Get forks data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Forks data
   */
  forks: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'forks'),

  /**
   * Get stars data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Stars data
   */
  stars: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'stars'),

  /**
   * Get issues opened data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Issues opened data
   */
  issuesOpened: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'issues_opened'),

  /**
   * Get issues closed data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Issues closed data
   */
  issuesClosed: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'issues_closed'),

  /**
   * Get issue comments data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Issue comments data
   */
  issueComments: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'issue_comments'),

  /**
   * Get PR opened data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns PR opened data
   */
  PROpened: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'PR_opened'),

  /**
   * Get PR merged data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns PR merged data
   */
  PRMerged: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'PR_merged'),

  /**
   * Get PR reviews data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns PR reviews data
   */
  PRReviews: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'PR_reviews'),

  /**
   * Get merged code addition data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Merged code addition data
   */
  mergedCodeAddition: (platform: string, repo: string) =>
    getMetricByName(platform, repo, metricNameMap, 'merged_code_addition'),

  /**
   * Get merged code deletion data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Merged code deletion data
   */
  mergedCodeDeletion: (platform: string, repo: string) =>
    getMetricByName(platform, repo, metricNameMap, 'merged_code_deletion'),

  /**
   * Get merged code sum data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Merged code sum data
   */
  mergedCodeSum: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'merged_code_sum'),

  /**
   * Get developer network data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Developer network data
   */
  developerNetwork: (platform: string, repo: string) =>
    getMetricByName(platform, repo, metricNameMap, 'developer_network'),

  /**
   * Get repo network data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Repo network data
   */
  repoNetwork: (platform: string, repo: string) => getMetricByName(platform, repo, metricNameMap, 'repo_network'),

  /**
   * Get activity details data for a repository
   * @param platform Platform name (github/gitee)
   * @param repo Repository full name (owner/repo)
   * @returns Activity details data
   */
  activityDetails: (platform: string, repo: string) =>
    getMetricByName(platform, repo, metricNameMap, 'activity_details'),
};

// Backward compatibility exports
export const getActivity = repoMetrics.activity;
export const getOpenrank = repoMetrics.openrank;
export const getParticipant = repoMetrics.participant;
export const getContributor = repoMetrics.contributor;
export const getForks = repoMetrics.forks;
export const getStars = repoMetrics.stars;
export const getIssuesOpened = repoMetrics.issuesOpened;
export const getIssuesClosed = repoMetrics.issuesClosed;
export const getIssueComments = repoMetrics.issueComments;
export const getPROpened = repoMetrics.PROpened;
export const getPRMerged = repoMetrics.PRMerged;
export const getPRReviews = repoMetrics.PRReviews;
export const getMergedCodeAddition = repoMetrics.mergedCodeAddition;
export const getMergedCodeDeletion = repoMetrics.mergedCodeDeletion;
export const getMergedCodeSum = repoMetrics.mergedCodeSum;
export const getDeveloperNetwork = repoMetrics.developerNetwork;
export const getRepoNetwork = repoMetrics.repoNetwork;
export const getActivityDetails = repoMetrics.activityDetails;
