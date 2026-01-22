// 类型定义文件，用于报告生成器

export type TimeSeriesData = [string, number][]; // [["YYYY-MM", number], ...]

export interface SeriesData {
  [key: string]: number;
}

export interface LastTwoByMonthResult {
  cur: number;
  prev: number;
  diff: number;
  pct: number;
  curMonth: string;
  prevMonth: string;
}

export interface ContributorInfo {
  login: string;
  commits?: number;
}

export interface QuarterInfo {
  year: number;
  quarter: number;
  startMonth: number;
  endMonth: number;
}

export interface FilteredPayload {
  repoName: string;
  quarter: string;
  prevQuarter: string;
  activity: SeriesData | TimeSeriesData;
  openrank: SeriesData | TimeSeriesData;
  attention: SeriesData | TimeSeriesData;
  participant: SeriesData | TimeSeriesData;
  contributor: SeriesData | TimeSeriesData;
  stars: SeriesData | TimeSeriesData;
  forks: SeriesData | TimeSeriesData;
  issuesOpened: SeriesData | TimeSeriesData;
  issuesClosed: SeriesData | TimeSeriesData;
  issueComments: SeriesData | TimeSeriesData;
  prOpened: SeriesData | TimeSeriesData;
  prMerged: SeriesData | TimeSeriesData;
  prReviews: SeriesData | TimeSeriesData;
  issueResponseTime: SeriesData | TimeSeriesData;
  issueResolutionDuration: SeriesData | TimeSeriesData;
}

