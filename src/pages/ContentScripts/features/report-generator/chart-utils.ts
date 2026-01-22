/**
 * 图表生成工具函数
 */

import type { SeriesData } from './types';

/**
 * 生成趋势图表配置
 */
export function createTrendChartOption(
  months: string[],
  activityVals: number[],
  openrankVals: number[],
  starsVals: number[],
  forksVals: number[],
  contribVals: number[]
) {
  return {
    title: { text: '近6个月核心指标趋势', left: 'center', top: 8, textStyle: { fontSize: 14 } },
    legend: { data: ['Activity', 'OpenRank', 'Star', 'Fork', '贡献者'], top: 30 },
    grid: { top: 65, left: 60, right: 18, bottom: 40 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', splitNumber: 4 },
    series: [
      {
        name: 'Activity',
        data: activityVals,
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 8,
      },
      {
        name: 'OpenRank',
        data: openrankVals,
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 8,
      },
      {
        name: 'Star',
        data: starsVals,
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 8,
      },
      {
        name: 'Fork',
        data: forksVals,
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 8,
      },
      {
        name: '贡献者',
        data: contribVals,
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 8,
      },
    ],
  };
}

/**
 * 生成图表 base64 图片
 */
export async function generateChartBase64(
  months: string[],
  activity: SeriesData,
  openrank: SeriesData,
  stars: SeriesData,
  forks: SeriesData,
  contributor: SeriesData,
  getvalues: (series: SeriesData) => number[]
): Promise<string> {
  const echarts = await import('echarts');
  const div = document.createElement('div');
  div.style.cssText = 'width:600px; height:340px; position:fixed; left:-9999px;';
  document.body.appendChild(div);
  
  const chart = echarts.init(div);
  const activityVals = getvalues(activity);
  const openrankVals = getvalues(openrank);
  const starsVals = getvalues(stars);
  const forksVals = getvalues(forks);
  const contribVals = getvalues(contributor);

  // 判空逻辑
  const isAllEmpty =
    months.length === 0 ||
    [activityVals, openrankVals, starsVals, forksVals, contribVals].every((arr) => arr.every((v) => v === 0));

  if (isAllEmpty) {
    document.body.removeChild(div);
    return '';
  }

  const option = createTrendChartOption(months, activityVals, openrankVals, starsVals, forksVals, contribVals);
  chart.setOption(option);
  
  await new Promise((resolve) => setTimeout(resolve, 350));
  const base64 = chart.getDataURL({ type: 'png', pixelRatio: 2 });
  document.body.removeChild(div);
  chart.dispose();
  
  return base64;
}

