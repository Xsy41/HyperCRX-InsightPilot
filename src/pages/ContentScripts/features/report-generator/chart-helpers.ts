/**
 * 图表生成辅助函数
 */

import type { SeriesData } from './types';
import { CHART_CONFIG } from './constants';

/**
 * 创建图表容器（用于导出）
 */
export function createChartContainer(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.cssText = `width:${CHART_CONFIG.WIDTH}px; height:${CHART_CONFIG.HEIGHT}px; position:fixed; left:-9999px;`;
  document.body.appendChild(div);
  return div;
}

/**
 * 清理图表容器
 */
export function cleanupChartContainer(div: HTMLDivElement, chart: any): void {
  if (div && div.parentNode) {
    document.body.removeChild(div);
  }
  if (chart) {
    chart.dispose();
  }
}

/**
 * 等待图表渲染完成
 */
export function waitForChartRender(delay: number = CHART_CONFIG.RENDER_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * 检查数据是否为空
 */
export function isDataEmpty(
  months: string[],
  activityVals: number[],
  openrankVals: number[],
  starsVals: number[],
  forksVals: number[],
  contribVals: number[]
): boolean {
  return (
    months.length === 0 ||
    [activityVals, openrankVals, starsVals, forksVals, contribVals].every((arr) => arr.every((v) => v === 0))
  );
}

/**
 * 创建空数据图表配置
 */
export function createEmptyChartOption(months: string[], mformat: (m: string) => string) {
  return {
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
        interval: 0,
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
}

/**
 * 创建趋势图表配置
 */
export function createTrendChartOption(
  months: string[],
  mformat: (m: string) => string,
  activityVals: number[],
  openrankVals: number[],
  starsVals: number[],
  forksVals: number[],
  contribVals: number[]
) {
  return {
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

