/**
 * 数据获取函数集合
 */

import {
  getActivity,
  getOpenrank,
  getAttention,
  getParticipant,
  getContributor,
  getStars,
  getForks,
  getIssuesOpened,
  getIssuesClosed,
  getIssueComments,
  getPROpened,
  getPRMerged,
  getPRReviews,
  getIssueResponseTime,
  getIssueResolutionDuration,
  getActivityDetails,
} from '../../../../api/repo';
import { RepoMeta } from '../../../../api/common';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';

/**
 * 获取所有仓库指标数据
 */
export async function fetchAllRepoMetrics(repo: string, meta: RepoMeta) {
  const [
    activity,
    openrank,
    attention,
    participant,
    contributor,
    stars,
    forks,
    issuesOpened,
    issuesClosed,
    issueComments,
    prOpened,
    prMerged,
    prReviews,
    issueResponseTime,
    issueResolutionDuration,
    activityDetails,
  ] = await Promise.all([
    getActivity(repo),
    getOpenrank(repo),
    getAttention(repo),
    getParticipant(repo),
    getContributor(repo),
    getStars(repo),
    getForks(repo),
    getIssuesOpened(repo),
    getIssuesClosed(repo),
    getIssueComments(repo),
    getPROpened(repo),
    getPRMerged(repo),
    getPRReviews(repo),
    getIssueResponseTime(repo),
    getIssueResolutionDuration(repo),
    getActivityDetails(repo),
  ]);

  return {
    activity: generateDataByMonth(activity, meta.updatedAt),
    openrank: generateDataByMonth(openrank, meta.updatedAt),
    attention: generateDataByMonth(attention, meta.updatedAt),
    participant: generateDataByMonth(participant, meta.updatedAt),
    contributor: generateDataByMonth(contributor, meta.updatedAt),
    stars: generateDataByMonth(stars, meta.updatedAt),
    forks: generateDataByMonth(forks, meta.updatedAt),
    issuesOpened: generateDataByMonth(issuesOpened, meta.updatedAt),
    issuesClosed: generateDataByMonth(issuesClosed, meta.updatedAt),
    issueComments: generateDataByMonth(issueComments, meta.updatedAt),
    prOpened: generateDataByMonth(prOpened, meta.updatedAt),
    prMerged: generateDataByMonth(prMerged, meta.updatedAt),
    prReviews: generateDataByMonth(prReviews, meta.updatedAt),
    issueResponseTime: generateDataByMonth(issueResponseTime, meta.updatedAt),
    issueResolutionDuration: generateDataByMonth(issueResolutionDuration, meta.updatedAt),
    activityDetails,
  };
}

