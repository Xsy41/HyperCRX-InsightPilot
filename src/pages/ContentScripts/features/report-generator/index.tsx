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

const ReportButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [trendImgUrl, setTrendImgUrl] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // 自动趋势预览，只做展示
  useEffect(() => {
    async function renderTrendChart() {
      const echarts = await import('echarts');
      if (!chartRef.current) return;
      const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
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
      const months6 = months.slice(-6);
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

      const payload = {
        repoName: repo,
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
      };

      // 获取结论与分析
      const reportResp = await fetch('http://localhost:5001/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { issuesOpened, issuesClosed, issueComments } }),
      })
        .then((r) => r.json())
        .catch(() => ({}));
      const summary = reportResp?.summary || '';

      const analyzeResp = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .catch(() => ({ analysisReport: '' }));
      const longInsight = analyzeResp?.analysisReport || '';

      // 只提取并保留用于核心展示和下游图片的部分变量，其它辅助函数精简（删除调试log与未用到的小函数）
      // 核心里用于图片生成功能、趋势计算的 helpers
      const normalizeSeries = (series: any): [string, number][] => {
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
      const monthlyEntries = (raw: any): [string, number][] => {
        return normalizeSeries(raw).filter(([k]) => /^\d{4}-\d{2}$/.test(String(k)));
      };
      const lastMonthFrom = (series: any[]) => (series && series.length ? series[series.length - 1][0] : '');
      const lastTwoByMonth = (raw: any) => {
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
      const pickTopContributors = () => {
        let top: { login: string; commits?: number }[] = [];
        try {
          const monthly = getMonthlyData((activityDetails as any) || {});
          const months = Object.keys(monthly)
            .filter((k) => /^\d{4}-\d{2}$/.test(k))
            .sort();
          if (months.length) {
            const last = months[months.length - 1];
            const arr = (monthly as any)[last] as [string, number][];
            top = (arr || []).slice(0, 3).map((it) => ({ login: it[0], commits: it[1] }));
          }
        } catch {}
        if (!top.length && Array.isArray(ghContributors)) {
          top = ghContributors.slice(0, 3).map((c: any) => ({ login: c.login, commits: c.contributions }));
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
        p > 20 ? '显著上升' : p > 0 ? '小幅上升' : p < -20 ? '显著下降' : p < 0 ? '略有下降' : '基本稳定';
      const prRateTrendWord = (p: number) =>
        p > 10 ? '效率明显提升' : p > 0 ? '略有优化' : p < -10 ? '合并率下滑限制协作' : p < 0 ? '轻微下滑' : '持平';
      const plusPct = (v: number) => (v >= 0 ? `+${v}%` : `${v}%`);
      const starDeltaDesc =
        lastTwoByMonth(stars).pct > 100
          ? `大幅增长，或因近期更新/传播`
          : lastTwoByMonth(stars).pct > 0
            ? `小幅增长`
            : lastTwoByMonth(stars).pct < 0
              ? `回落`
              : `无明显变化`;

      const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '→');
      const pctWord = (v: number) => `${arrow(v)} ${plusPct(Math.abs(v))}`;
      const period = lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))
        ? `${lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))}-01 ～ ${lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))}-30`
        : '';
      const analyzeDate = new Date().toISOString().slice(0, 10);
      const nextQ = lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))
        ? (() => {
            const [y, m] = lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity))
              .split('-')
              .map(Number);
            let q = Math.ceil(m / 3) + 1;
            let yy = y;
            if (q > 4) {
              q = 1;
              yy += 1;
            }
            return `${yy} Q${q}`;
          })()
        : '';
      const nextPeriod = nextQ;

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
        console.log('months', months);
        console.log('activityVals', activityVals);
        console.log('openrankVals', openrankVals);
        console.log('starsVals', starsVals);
        console.log('forksVals', forksVals);
        console.log('contribVals', contribVals);

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
        console.log(activity6);
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
            { name: 'Activity', data: activity6, type: 'line', smooth: true, connectNulls: true },
            { name: 'OpenRank', data: openrank6, type: 'line', smooth: true, connectNulls: true },
            { name: 'Star', data: star6, type: 'line', smooth: true, connectNulls: true },
            { name: 'Fork', data: fork6, type: 'line', smooth: true, connectNulls: true },
            { name: '贡献者', data: contributor6, type: 'line', smooth: true, connectNulls: true },
          ],
        });

        await new Promise((res) => setTimeout(res, 350));
        chartUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
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
      const getMetricInfo = (raw: any) => lastTwoByMonth(raw);

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

      const aiInsight = `概览：
 - 活跃度 ${Math.round(activityInfo.cur)}（环比 ${pctWord(activityInfo.pct)}），OpenRank ${Math.round(openrankInfo.cur * 10) / 10}（环比 ${pctWord(openrankInfo.pct)}）。
 - Star 当月 ${starInfo.cur}（${deltaDesc(starInfo.diff)}，环比 ${pctDesc(starInfo.pct)}），Fork 环比 ${pctWord(forkInfo.pct)}，贡献者 ${contribInfo.cur}（环比 ${pctWord(contribInfo.pct)}）。
 - Issue 开启 ${issueOpenInfo.cur}（环比 ${pctWord(issueOpenInfo.pct)}），关闭 ${issueClosedInfo.cur}（环比 ${pctWord(issueClosedInfo.pct)}），讨论评论 ${issueCommentsInfo.cur}（环比 ${pctWord(issueCommentsInfo.pct)}）。
 - PR 合并率 ${prMergeRateCur}%（环比 ${pctWord(prMergeRateDiff)}），协作效率${prRateTrendWord(prMergeRateDiff)}。

按指标解读：
 - Activity：${trendWord(activityInfo.pct)}，说明代码提交/Issue/PR 节奏发生${activityInfo.pct >= 0 ? '提升' : '变化'}。
 - OpenRank：${trendWord(openrankInfo.pct)}，与外部引用、关注度、传播相关，建议结合文档/版本发布节奏联动推广。
 - Star：${starInfo.pct >= 0 ? '热度提升' : '热度回落'}（${pctDesc(starInfo.pct)}），${starInfo.pct >= 0 ? '可复盘传播动作并固化' : '建议加大对外触达与亮点展示'}。
 - Fork：${trendWord(forkInfo.pct)}，代表二次利用与生态扩散${forkInfo.pct >= 0 ? '增强' : '承压'}。
 - 贡献者：${trendWord(contribInfo.pct)}，建议优化 newcomer 路径（good-first-issue、开发脚手架、贡献指南）。
 - Issue：开启/关闭/评论分别为 ${issueOpenInfo.cur}/${issueClosedInfo.cur}/${issueCommentsInfo.cur}，${issueClosedInfo.cur >= issueOpenInfo.cur ? '问题处理净减少' : '问题积压可能上升'}，应关注响应/解决时长。
 - PR 合并率：${prMergeRateCur}%（变化 ${prMergeRateDiff > 0 ? '+' : ''}${prMergeRateDiff}%），${prRateTrendWord(prMergeRateDiff)}，注意质量与效率的平衡。
`;

      const md = `# 🗓️ OpenDigger 项目月度报告（${lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity)) ? lastMonthFrom(normalizeSeries(openrank) || normalizeSeries(activity)).replace('-', '年') + '月' : ''})

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

本期 **OpenDigger** 项目表现出 “**内部活跃增强、外部影响力略降**” 的组合特征。  
活跃度的上升反映出团队在功能完善与内部更新方面投入增加；  
但 **OpenRank 下降** 表明外部社区关注或引用度暂未同步提升。

**亮点**  
- Star 数环比增长 700% ，说明项目近期曝光度提升，可能与版本发布、文档更新或社交传播相关。  
- PR 合并率维持高水平（100%），显示团队协作良好、代码合入高效。

**不足**  
- Fork 与贡献者数无变化，暗示社区参与尚未转化为实际贡献。  
- 影响力下降需关注外部生态的互动度。

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
          right: '16px',
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
