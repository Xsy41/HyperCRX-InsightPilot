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
  activity: SeriesData | TimeSeriesData | null | undefined;
  openrank: SeriesData | TimeSeriesData | null | undefined;
  attention: SeriesData | TimeSeriesData | null | undefined;
  participant: SeriesData | TimeSeriesData | null | undefined;
  contributor: SeriesData | TimeSeriesData | null | undefined;
  stars: SeriesData | TimeSeriesData | null | undefined;
  forks: SeriesData | TimeSeriesData | null | undefined;
  issuesOpened: SeriesData | TimeSeriesData | null | undefined;
  issuesClosed: SeriesData | TimeSeriesData | null | undefined;
  issueComments: SeriesData | TimeSeriesData | null | undefined;
  prOpened: SeriesData | TimeSeriesData | null | undefined;
  prMerged: SeriesData | TimeSeriesData | null | undefined;
  prReviews: SeriesData | TimeSeriesData | null | undefined;
  issueResponseTime: SeriesData | TimeSeriesData | null | undefined;
  issueResolutionDuration: SeriesData | TimeSeriesData | null | undefined;
}

