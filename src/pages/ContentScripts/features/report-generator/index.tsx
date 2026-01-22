import features from '../../../../feature-manager';
import elementReady from 'element-ready';
import { getRepoName, isPublicRepoWithMeta } from '../../../../helpers/get-github-repo-info';
import { getPlatform } from '../../../../helpers/get-platform';
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
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

const featureId = features.getFeatureID(import.meta.url);
import isGithub from '../../../../helpers/is-github';
import { githubRequest } from '../../../../api/githubApi';
import { getMonthlyData } from '../repo-activity-racing-bar/data';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import { normalizeSeries, monthlyEntries, lastMonthFrom, lastTwoByMonth, formatMonthShort } from './formatting-utils';
import {
  getPreviousQuarter,
  getNextQuarter,
  getQuarterMonths,
  getQuarterTitle,
  getQuarterPeriod,
} from '../../../../helpers/quarter-utils';

const ReportButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [trendImgUrl, setTrendImgUrl] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // 自动趋势预览，只做展示
  useEffect(() => {
    async function renderTrendChart() {
      const echarts = await import('echarts');
      if (!chartRef.current) return;
      // 动态生成最近6个月的预览数据
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      }
      const option = {
        title: { text: '近六个月核心指标趋势', left: 'center', top: 8, textStyle: { fontSize: 14 } },
        legend: { data: ['Activity', 'OpenRank', 'Star', 'Fork', '贡献者'], top: 30 },
        grid: { top: 65, left: 60, right: 18, bottom: 40 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: months },
        yAxis: { type: 'value', splitNumber: 4 },
        series: [
          {
            name: 'Activity',
            data: [7.57, 12.73, 1.45, 5.85, 6.04, 8.13],
            type: 'line',
            smooth: true,
            connectNulls: true,
            showSymbol: true,
            symbolSize: 8,
          },
          {
            name: 'OpenRank',
            data: [4.8, 6.74, 2.4, 2.73, 4.54, 4.16],
            type: 'line',
            smooth: true,
            connectNulls: true,
            showSymbol: true,
            symbolSize: 8,
          },
          {
            name: 'Star',
            data: [1, 1, 2, 2, 1, 8],
            type: 'line',
            smooth: true,
            connectNulls: true,
            showSymbol: true,
            symbolSize: 8,
          },
          {
            name: 'Fork',
            data: [0, 2, 0, 2, 0, 2],
            type: 'line',
            smooth: true,
            connectNulls: true,
            showSymbol: true,
            symbolSize: 8,
          },
          {
            name: '贡献者',
            data: [2, 2, 0, 0, 2, 2],
            type: 'line',
            smooth: true,
            connectNulls: true,
            showSymbol: true,
            symbolSize: 8,
          },
        ],
      };
      const chart = echarts.init(chartRef.current);
      chart.setOption(option);
      await new Promise((res) => setTimeout(res, 350));
      setTrendImgUrl(chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }));
      chart.dispose();
    }
    renderTrendChart();
  }, []);

  // handleClick/生成报告部分，完全自包自己的 fetch/变量/逻辑，和 useEffect 内无耦合
  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const repo = getRepoName();
      const platform = getPlatform();
      // 获取数据
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
        getActivity(platform, repo),
        getOpenrank(platform, repo),
        getAttention(platform, repo),
        getParticipant(platform, repo),
        getContributor(platform, repo),
        getStars(platform, repo),
        getForks(platform, repo),
        getIssuesOpened(platform, repo),
        getIssuesClosed(platform, repo),
        getIssueComments(platform, repo),
        getPROpened(platform, repo),
        getPRMerged(platform, repo),
        getPRReviews(platform, repo),
        getIssueResponseTime(platform, repo),
        getIssueResolutionDuration(platform, repo),
        getActivityDetails(platform, repo),
      ]);
      // months、getvalues、mformat 也单独定义（与 useEffect分离）
      const trendData = generateDataByMonth(activity, Date.now());
      const months = trendData.map(([month]: [string, number]) => month);
      const mformat = (m: string) => {
        const [y, mo] = String(m).split('-');
        const yy = (y || '').slice(-2);
        return `${yy}/${mo || ''}`;
      };
      const months6 = months.slice(-REPORT_CONFIG.MONTHS_TO_ANALYZE);
      const getvalues = (series: Record<string, number>) => {
        const arr = generateDataByMonth(series, Date.now());
        const map = new Map(arr);
        return months6.map((m: string) => map.get(m) ?? 0);
      };

      // 可选：实时 GitHub 数据增强（若绑定了 GitHub Token）
      const [ghRepo, ghContributors] = await Promise.all([
        githubRequest(`/repos/${repo}`),
        githubRequest(`/repos/${repo}/contributors?per_page=3`),
      ]);

      // 计算报告季度（上一个季度）和对比季度，用于过滤数据
      const reportQuarter = getPreviousQuarter();
      const compareQuarter = (() => {
        let compareQ = reportQuarter.quarter - 1;
        let compareY = reportQuarter.year;
        if (compareQ < 1) {
          compareQ = 4;
          compareY = reportQuarter.year - 1;
        }
        return { year: compareY, quarter: compareQ };
      })();
      
      // 获取两个季度的所有月份（共6个月）
      const reportQuarterMonths = getQuarterMonths(reportQuarter.year, reportQuarter.quarter); // 主要分析的季度
      const compareQuarterMonths = getQuarterMonths(compareQuarter.year, compareQuarter.quarter); // 对比季度
      
      const quarterMonths = [...compareQuarterMonths, ...reportQuarterMonths];
      const quarterMonthsSet = new Set(quarterMonths);
      
      // 过滤函数：只保留季度相关的月份数据
      const filterByQuarter = (data: SeriesData | TimeSeriesData | null | undefined): SeriesData | TimeSeriesData | null | undefined => {
        if (!data) return data;
        if (Array.isArray(data)) {
          return data.filter(([month]: [string, number]) => quarterMonthsSet.has(month)) as TimeSeriesData;
        }
        if (typeof data === 'object') {
          const filtered: SeriesData = {};
          Object.keys(data).forEach(key => {
            const month = String(key).replace(/^([0-9]{4})-([0-9]{1,2})$/, (_, y, m) => `${y}-${m.padStart(2, '0')}`);
            if (quarterMonthsSet.has(month)) {
              filtered[key] = data[key];
            }
          });
          return filtered;
        }
        return data;
      };

      // 过滤数据，只保留报告季度和对比季度的数据（半年数据）
      const filteredPayload: FilteredPayload = {
        repoName: repo,
        quarter: getQuarterTitle(reportQuarter.year, reportQuarter.quarter),
        prevQuarter: getQuarterTitle(compareQuarter.year, compareQuarter.quarter),
        activity: filterByQuarter(activity),
        openrank: filterByQuarter(openrank),
        attention: filterByQuarter(attention),
        participant: filterByQuarter(participant),
        contributor: filterByQuarter(contributor),
        stars: filterByQuarter(stars),
        forks: filterByQuarter(forks),
        issuesOpened: filterByQuarter(issuesOpened),
        issuesClosed: filterByQuarter(issuesClosed),
        issueComments: filterByQuarter(issueComments),
        prOpened: filterByQuarter(prOpened),
        prMerged: filterByQuarter(prMerged),
        prReviews: filterByQuarter(prReviews),
        issueResponseTime: filterByQuarter(issueResponseTime),
        issueResolutionDuration: filterByQuarter(issueResolutionDuration),
      };

      // 获取结论与分析（使用完整数据）
      let summary = '';
      let longInsight = '';
      
      try {
        const reportResp = await apiCall<{ summary?: string }>(API_ENDPOINTS.REPORT, {
          method: 'POST',
          body: JSON.stringify({ data: { issuesOpened, issuesClosed, issueComments } }),
        });
        summary = reportResp?.summary || '';
      } catch (error) {
        console.error('获取报告摘要失败:', error);
        // 继续执行，summary 保持为空字符串
      }

      // 深度洞察使用过滤后的季度数据
      try {
        const analyzeResp = await apiCall<{ analysisReport?: string }>(API_ENDPOINTS.ANALYZE, {
          method: 'POST',
          body: JSON.stringify(filteredPayload),
        });
        longInsight = analyzeResp?.analysisReport || '';
      } catch (error) {
        console.error('获取深度洞察失败:', error);
        // 继续执行，longInsight 保持为空字符串
      }

      // 不再单独获取 OpenRank 和 Star 的 AI 解读，只保留综合分析和深度洞察

      // 只提取并保留用于核心展示和下游图片的部分变量，其它辅助函数精简（删除调试log与未用到的小函数）
      // 核心里用于图片生成功能、趋势计算的 helpers
      const normalizeSeries = (series: SeriesData | TimeSeriesData | null | undefined): TimeSeriesData => {
        if (!series) return [];
        if (Array.isArray(series)) return series as [string, number][];
        if (typeof series === 'object') {
          return Object.keys(series)
            .map((k): [string, number] => {
              // 保证格式为 YYYY-MM（两位月份）
              const m = String(k).replace(
                /^([0-9]{4})-([0-9]{1,2})$/,
                (_: string, y: string, mo: string) => `${y}-${mo.padStart(2, '0')}`
              );
              return [m, Number(series[k]) || 0];
            })
            .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime());
        }
        return [];
      };
      const monthlyEntries = (raw: SeriesData | TimeSeriesData | null | undefined): TimeSeriesData => {
        return normalizeSeries(raw).filter(([k]) => /^\d{4}-\d{2}$/.test(String(k)));
      };
      const lastMonthFrom = (series: TimeSeriesData): string => (series && series.length ? series[series.length - 1][0] : '');
      const lastTwoByMonth = (raw: SeriesData | TimeSeriesData | null | undefined): LastTwoByMonthResult => {
        const series = monthlyEntries(raw);
        const map = new Map<string, number>();
        series.forEach((it) => {
          const k = String(it[0]);
          const v = Number(it[1]) || 0;
          map.set(k, v);
        });
        const months = Array.from(map.keys()).sort();
        const n = months.length;
        const curMonth = n > 0 ? months[n - 1] : '';
        const prevMonth = n > 1 ? months[n - 2] : '';
        const cur = curMonth ? map.get(curMonth)! : 0;
        const prev = prevMonth ? map.get(prevMonth)! : 0;
        return { cur, prev, diff: cur - prev, pct: Math.round(((cur - prev) / prev) * 1000) / 10, curMonth, prevMonth };
      };

      // 从 activity_details（与 racing-bar 一致的月度结构）取当月Top3，否则回退 GitHub /contributors
      const pickTopContributors = (): ContributorInfo[] => {
        let top: ContributorInfo[] = [];
        try {
          const monthly = getMonthlyData(activityDetails || {});
          const months = Object.keys(monthly)
            .filter((k) => /^\d{4}-\d{2}$/.test(k))
            .sort();
          if (months.length) {
            const last = months[months.length - 1];
            const arr = monthly[last] as TimeSeriesData | undefined;
            top = (arr || []).slice(0, 3).map((it) => ({ login: it[0], commits: it[1] }));
          }
        } catch {}
        if (!top.length && Array.isArray(ghContributors)) {
          top = ghContributors.slice(0, 3).map((c) => ({ login: c.login, commits: c.contributions }));
        }
        return top;
      };
      const topContrib = pickTopContributors();
      const bestContributor = topContrib[0] || null;

      // 统计当月每位开发者“提 Issue 数 / 提 PR 数”（GitHub Search API）
      const fetchAuthorMonthlyStats = async (fullRepo: string, logins: string[], monthKey: string) => {
        try {
          if (!monthKey || !logins.length) return {} as Record<string, { issueOpened: number; prOpened: number }>;
          const [owner, name] = fullRepo.split('/');
          const [yy, mm] = monthKey.split('-').map((s) => Number(s));
          const first = `${yy}-${String(mm).padStart(2, '0')}-01`;
          const last = new Date(yy, mm, 0).toISOString().slice(0, 10); // 当月最后一天

          const count = async (query: string) => {
            const res = await githubRequest(`/search/issues?q=${encodeURIComponent(query)}`);
            return res?.total_count ?? 0;
          };

          const stats: Record<string, { issueOpened: number; prOpened: number }> = {};
          for (const login of logins) {
            const issueQ = `repo:${owner}/${name} is:issue author:${login} created:${first}..${last}`;
            const prQ = `repo:${owner}/${name} is:pr author:${login} created:${first}..${last}`;
            const [issueOpened, prOpened] = await Promise.all([count(issueQ), count(prQ)]);
            stats[login] = { issueOpened, prOpened };
          }
          return stats;
        } catch {
          return {} as Record<string, { issueOpened: number; prOpened: number }>;
        }
      };

      const authorStats = await fetchAuthorMonthlyStats(
        repo,
        topContrib.map((t) => t.login),
        lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))
      );

      const toQuarter = (m: string) => {
        if (!m) return '';
        const [y, mo] = m.split('-').map((x) => Number(x));
        const q = Math.ceil(mo / 3);
        return `${y} Q${q}`;
      };
      const trendWord = (p: number) =>
        p > TREND_THRESHOLDS.SIGNIFICANT_INCREASE ? TREND_DESCRIPTIONS.SIGNIFICANT_UP
        : p > 0 ? TREND_DESCRIPTIONS.SLIGHT_UP
        : p < TREND_THRESHOLDS.SIGNIFICANT_DECREASE ? TREND_DESCRIPTIONS.SIGNIFICANT_DOWN
        : p < 0 ? TREND_DESCRIPTIONS.SLIGHT_DOWN
        : TREND_DESCRIPTIONS.STABLE;
      const prRateTrendWord = (p: number) =>
        p > TREND_THRESHOLDS.PR_RATE_SIGNIFICANT ? PR_RATE_DESCRIPTIONS.EFFICIENCY_IMPROVED
        : p > 0 ? PR_RATE_DESCRIPTIONS.SLIGHT_OPTIMIZATION
        : p < TREND_THRESHOLDS.PR_RATE_DECREASE ? PR_RATE_DESCRIPTIONS.RATE_DECLINED
        : p < 0 ? PR_RATE_DESCRIPTIONS.SLIGHT_DECLINE
        : PR_RATE_DESCRIPTIONS.FLAT;
      const plusPct = (v: number) => (v >= 0 ? `+${v}%` : `${v}%`);
      const starDeltaDesc =
        lastTwoByMonth(stars).pct > TREND_THRESHOLDS.STAR_GROWTH_HIGH
          ? STAR_DELTA_DESCRIPTIONS.HIGH_GROWTH
          : lastTwoByMonth(stars).pct > 0
            ? STAR_DELTA_DESCRIPTIONS.SLIGHT_GROWTH
            : lastTwoByMonth(stars).pct < 0
              ? STAR_DELTA_DESCRIPTIONS.DECLINE
              : STAR_DELTA_DESCRIPTIONS.NO_CHANGE;

      const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '→');
      const pctWord = (v: number) => `${arrow(v)} ${plusPct(Math.abs(v))}`;
      
      // 计算上一个季度报告周期（始终显示上一个季度）
      const period = getQuarterPeriod(reportQuarter.year, reportQuarter.quarter);
      const analyzeDate = new Date().toISOString().slice(0, 10);
      
      // 计算下一个季度（基于报告季度）
      const nextQuarter = getNextQuarter();
      const nextPeriod = getQuarterTitle(nextQuarter.year, nextQuarter.quarter);

      // 生成6个月趋势图，返回base64图片
      const generateTrendsChartBase64 = async (
        months: string[],
        mformat: (str: string) => string,
        getvalues: (series: Record<string, number>) => number[],
        activity: Record<string, number>,
        openrank: Record<string, number>,
        stars: Record<string, number>,
        forks: Record<string, number>,
        contributor: Record<string, number>
      ): Promise<string> => {
        const echarts = await import('echarts');
        const div = document.createElement('div');
        div.style.cssText = 'width:600px; height:340px; position:fixed; left:-9999px;';
        document.body.appendChild(div);
        const chart = echarts.init(div);
        // 直接用handleClick传进来的months和getvalues
        const activityVals = getvalues(activity);
        const openrankVals = getvalues(openrank);
        const starsVals = getvalues(stars);
        const forksVals = getvalues(forks);
        const contribVals = getvalues(contributor);

        // 判空逻辑
        const isAllEmpty =
          months.length === 0 ||
          [activityVals, openrankVals, starsVals, forksVals, contribVals].every((arr) => arr.every((v) => v === 0));
        let option;
        if (isAllEmpty) {
          option = {
            title: {
              text: '近6个月核心指标趋势',
              left: 'center',
              top: 8,
              textStyle: { fontSize: 14 },
            },
            grid: { top: 65, left: 60, right: 18, bottom: 60 },
            legend: { data: ['Activity', 'OpenRank', 'Star', 'Fork', '贡献者'], top: 30 },
            xAxis: {
              type: 'category',
              data: months.map(mformat),
              axisLabel: {
                interval: 0, // 每个月都显示
                rotate: 0,
                fontSize: 11,
                color: '#666',
                margin: 16,
              },
              axisTick: { show: false },
            },
            yAxis: { type: 'value', splitNumber: 4 },
            graphic: {
              type: 'text',
              left: 'center',
              top: 'center',
              style: {
                text: '暂无数据',
                fontSize: 30,
                fill: '#aaa',
                fontWeight: 'bold',
              },
            },
            series: [],
          };
        } else {
          option = {
            title: { text: '近6个月核心指标趋势', left: 'center', top: 8, textStyle: { fontSize: 14 } },
            legend: { data: ['Activity', 'OpenRank', 'Star', 'Fork', '贡献者'], top: 30 },
            grid: { top: 65, left: 60, right: 18, bottom: 60 },
            tooltip: { trigger: 'axis', valueFormatter: (v: number) => v.toString() },
            xAxis: {
              type: 'category',
              data: months.map(mformat),
              axisLabel: {
                interval: 0,
                rotate: 0,
                fontSize: 11,
                color: '#666',
                margin: 16,
              },
              axisTick: { show: false },
            },
            yAxis: { type: 'value', splitNumber: 4 },
            series: [
              { name: 'Activity', data: activityVals, type: 'line', smooth: true, connectNulls: true },
              { name: 'OpenRank', data: openrankVals, type: 'line', smooth: true, connectNulls: true },
              { name: 'Star', data: starsVals, type: 'line', smooth: true, connectNulls: true },
              { name: 'Fork', data: forksVals, type: 'line', smooth: true, connectNulls: true },
              { name: '贡献者', data: contribVals, type: 'line', smooth: true, connectNulls: true },
            ],
          };
        }
        chart.setOption(option);
        chart.resize();
        await new Promise((res: (value?: unknown) => void) => setTimeout(res, 500));
        const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
        chart.dispose();
        div.remove();
        return url;
      };

      // --- ECharts 直接画在 chartRef.current 节点并导出 ---
      let chartUrl = '';
      if (chartRef.current) {
        const echarts = await import('echarts');
        const chart = echarts.init(chartRef.current);
        const last6 = (arr: any[]) => arr.slice(-6);
        const months6Preview = last6(months.map(mformat));
        const activity6 = getvalues(activity);
        const openrank6 = getvalues(openrank);
        const star6 = getvalues(stars);
        const fork6 = getvalues(forks);
        const contributor6 = getvalues(contributor);
        chart.setOption({
          title: { text: '近6个月核心指标趋势', left: 'center', top: 8, textStyle: { fontSize: 14 } },
          legend: { data: ['Activity', 'OpenRank', 'Star', 'Fork', '贡献者'], top: 30 },
          grid: { top: 65, left: 60, right: 18, bottom: 60 },
          tooltip: { trigger: 'axis', valueFormatter: (v: number) => v.toString() },
          xAxis: {
            type: 'category',
            data: months6Preview,
            axisLabel: {
              interval: 0,
              rotate: 0,
              fontSize: 11,
              color: '#666',
              margin: 16,
            },
            axisTick: { show: false },
          },
          yAxis: { type: 'value', splitNumber: 4 },
          series: [
            { name: 'Activity', data: getvalues(activity), type: 'line', smooth: true, connectNulls: true },
            { name: 'OpenRank', data: getvalues(openrank), type: 'line', smooth: true, connectNulls: true },
            { name: 'Star', data: getvalues(stars), type: 'line', smooth: true, connectNulls: true },
            { name: 'Fork', data: getvalues(forks), type: 'line', smooth: true, connectNulls: true },
            { name: '贡献者', data: getvalues(contributor), type: 'line', smooth: true, connectNulls: true },
          ],
        });

        await new Promise((res) => setTimeout(res, 350));
        const chartUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
        setTrendImgUrl(chartUrl);
        chart.dispose();
      }
      // 统一调用
      const trendImgBase64 = await generateTrendsChartBase64(
        months6,
        mformat,
        getvalues,
        activity,
        openrank,
        stars,
        forks,
        contributor
      );
      setTrendImgUrl(trendImgBase64);

      // 核心趋势变量统一用lastTwoByMonth，删除所有M变量声明
      const getMetricInfo = (raw: SeriesData | TimeSeriesData | null | undefined): LastTwoByMonthResult => lastTwoByMonth(raw);

      // 统一图片生成函数，直接在handleClick时等待base64生成即可
      // 删除所有 trendImgBase64/months/mformat/getvalues 的重复声明，只保留 handleClick 内主逻辑的声明。
      // 其它地方如图片展示逻辑均接收 handleClick 算出的 trendImgUrl。

      // 直接改动趋势图渲染方式，删除chartRef部分，仅用 base64
      // 删除所有 trendImgBase64/months/mformat/getvalues 的重复声明，只保留 handleClick 内主逻辑的声明。
      // 其它地方如图片展示逻辑均接收 handleClick 算出的 trendImgUrl。

      // markdown导出里，所有指标的历史、环比等都直接使用lastTwoByMonth系列（无starsM、forksM、prMergeRateCur等单独变量）
      const activityInfo = lastTwoByMonth(activity);
      const openrankInfo = lastTwoByMonth(openrank);
      const starInfo = lastTwoByMonth(stars);
      const forkInfo = lastTwoByMonth(forks);
      const contribInfo = lastTwoByMonth(contributor);
      const prOpenInfo = lastTwoByMonth(prOpened);
      const prMergedInfo = lastTwoByMonth(prMerged);
      const prMergeRateCur = prOpenInfo.cur > 0 ? Math.round((prMergedInfo.cur / prOpenInfo.cur) * 100) : 0;
      const prOpenPrev = prOpenInfo.prev > 0 ? prOpenInfo.prev : 1;
      const prMergeRatePrev = Math.round(((prMergedInfo.prev || 0) / prOpenPrev) * 100);
      const prMergeRateDiff = prMergeRateCur - prMergeRatePrev;

      const issueOpenInfo = lastTwoByMonth(issuesOpened);
      const issueClosedInfo = lastTwoByMonth(issuesClosed);
      const issueCommentsInfo = lastTwoByMonth(issueComments);

      const deltaDesc = (v: number) => (v > 0 ? `增加 ${v}` : v < 0 ? `减少 ${Math.abs(v)}` : '持平');
      const pctDesc = (p: number) => `${arrow(p)} ${Math.abs(p)}%`;

      // 识别特别值得注意的数据（变化幅度大或异常值）
      const significantChanges: string[] = [];
      const notableMetrics: string[] = [];
      
      // 判断哪些指标变化显著（阈值：>20% 或 < -20%）
      if (Math.abs(activityInfo.pct) > 20) {
        significantChanges.push(`活跃度${trendWord(activityInfo.pct)}（${pctWord(activityInfo.pct)}）`);
      }
      if (Math.abs(openrankInfo.pct) > 20) {
        significantChanges.push(`OpenRank${trendWord(openrankInfo.pct)}（${pctWord(openrankInfo.pct)}）`);
      }
      if (Math.abs(starInfo.pct) > 20 || starInfo.pct > 100) {
        significantChanges.push(`Star${starInfo.pct >= 0 ? '大幅增长' : '显著下降'}（${pctDesc(starInfo.pct)}）`);
      }
      if (Math.abs(contribInfo.pct) > 20) {
        significantChanges.push(`贡献者数量${trendWord(contribInfo.pct)}（${pctWord(contribInfo.pct)}）`);
      }
      if (Math.abs(prMergeRateDiff) > 10) {
        notableMetrics.push(`PR 合并率${prMergeRateDiff > 0 ? '提升' : '下降'}至 ${prMergeRateCur}%（变化 ${prMergeRateDiff > 0 ? '+' : ''}${prMergeRateDiff}%）`);
      }
      if (issueOpenInfo.cur > 0 && issueClosedInfo.cur > 0) {
        const issueRatio = issueClosedInfo.cur / issueOpenInfo.cur;
        if (issueRatio < 0.5) {
          notableMetrics.push(`Issue 处理效率偏低（关闭/开启比 ${(issueRatio * 100).toFixed(0)}%）`);
        } else if (issueRatio > 1.5) {
          notableMetrics.push(`Issue 处理效率良好（关闭/开启比 ${(issueRatio * 100).toFixed(0)}%）`);
        }
      }
      
      // 构建总体概述
      let overview = '';
      if (significantChanges.length > 0) {
        overview = `本期项目在以下方面出现显著变化：${significantChanges.join('、')}。`;
      } else {
        overview = `本期项目各项指标整体保持相对稳定。`;
      }
      
      if (notableMetrics.length > 0) {
        overview += `\n\n值得关注：${notableMetrics.join('；')}。`;
      }
      
      // 如果所有指标都很稳定，给出总体评价
      if (significantChanges.length === 0 && notableMetrics.length === 0) {
        overview += `\n\n项目运行平稳，建议继续保持当前节奏，同时关注长期趋势变化。`;
      } else {
        overview += `\n\n建议结合具体业务场景，针对性地优化相关指标。`;
      }

      const aiInsight = overview;

      // 获取上一个季度标题（始终显示上一个季度）
      const quarterTitle = getQuarterTitle(reportQuarter.year, reportQuarter.quarter);
      const md = `# 🗓️ OpenDigger 项目季度报告（${quarterTitle || ''}）

> 报告周期：${period}  
> 数据来源：OpenDigger API  
> 分析生成时间：${analyzeDate}  
> 报告生成方式：AI自动生成（结合开源指标与自然语言分析）

---

## 📊 一、指标总览

| 指标名称 | 当前值 | 环比变化 | 解读 |
|:----------|:--------:|:-----------:|:------|
| **活跃度（Activity）** | ${Math.round(activityInfo.cur)} | ${pctWord(activityInfo.pct)} | 开发活跃度${trendWord(activityInfo.pct)} |
| **影响力（OpenRank）** | ${Math.round(openrankInfo.cur * 10) / 10} | ${pctWord(openrankInfo.pct)} | 外部引用与关注度${trendWord(openrankInfo.pct)} |
| **Star 数** | ${starInfo.cur} | ${arrow(starInfo.pct)} ${starInfo.pct > 0 ? '+' : ''}${starInfo.pct}%（${starInfo.diff >= 0 ? '+' : ''}${starInfo.diff}） | 热度${starDeltaDesc} |
| **Fork 数** | ${forkInfo.cur} | ${pctWord(forkInfo.pct)} | 开发者二次利用率${trendWord(forkInfo.pct)} |
| **贡献者数** | ${contribInfo.cur} | ${pctWord(contribInfo.pct)} | 团队规模${trendWord(contribInfo.pct)} |
| **PR 合并率** | ${prMergeRateCur}% | ${pctWord(prMergeRateDiff)} | 协作${prRateTrendWord(prMergeRateDiff)} |

---

## 📈 二、可视化趋势（自动生成）

> 近6个月主要指标，数据源：OpenDigger。曲线动画/导出PDF均可保留。
![近6个月多指标趋势](${trendImgBase64})

---

## 🤖 三、AI 自动解读

### 📈 综合指标分析

${aiInsight}

${longInsight ? `### 💡 深度洞察

${longInsight}
` : ''}

---

## 💡 四、综合分析与后续建议

| 方向 | 建议 | 预期效果 |
|:------|:------|:-----------|
| **外部传播** | 通过 Release 公告、X（Twitter）、知乎技术社区等提升曝光 | 增强项目影响力，吸引新用户 |
| **贡献者扩展** | 增设 \`good-first-issue\`、完善贡献指南 | 提高新开发者参与度 |
| **社区活跃闭环** | 定期发布“月报+周报”结合AI解读 | 提升参与粘性与反馈循环 |
| **指标优化** | 结合 open-digger API 自动生成可视化分析 | 提高数据透明度与可解释性 |

---

## 🧩 五、下期展望

- 🔄 继续跟踪 Star 与 OpenRank 变化，评估传播策略效果。  
- 🚀 准备 ${nextPeriod} 指标体系更新，增加“代码质量”和“响应速度”等维度。  
- 🤝 尝试引入社区参与度评分（基于 Issue 回复时长与 PR Review 数）。

---

> ✨ *报告由 AI 辅助生成，基于公开指标与上下文趋势分析，供项目团队内部参考。*
---
`;

      const Stackedit = require('stackedit-js');
      const stackedit = new Stackedit();
      stackedit.openFile({ content: { text: md } });
    } finally {
      setLoading(false);
    }
  };

  // 渲染趋势图预览（与前保持一致）
  return (
    <>
      <div style={{ width: 600, height: 340, margin: '0 auto', paddingBottom: 12 }}>
        <div ref={chartRef} style={{ width: 600, height: 340, display: trendImgUrl ? 'none' : 'block' }} />
        {trendImgUrl && <img src={trendImgUrl} alt="趋势可视化预览" style={{ width: '100%', borderRadius: 8 }} />}
      </div>
      <button
        onClick={handleClick}
        style={{
          position: 'fixed',
          left: '16px',
          bottom: '16px',
          zIndex: 99999,
          padding: '8px 12px',
          fontSize: '12px',
          borderRadius: '16px',
          border: '1px solid #d9d9d9',
          background: '#fff',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
        disabled={loading}
      >
        {loading ? '生成中…' : '生成项目报告'}
      </button>
    </>
  );
};

const init = async (): Promise<void> => {
  await elementReady('body');
  const el = document.createElement('div');
  document.body.appendChild(el);
  createRoot(el).render(<ReportButton />);
};

const restore = async (): Promise<void> => {};

features.add(featureId, {
  asLongAs: [isGithub, isPublicRepoWithMeta],
  awaitDomReady: false,
  init,
  restore,
});
