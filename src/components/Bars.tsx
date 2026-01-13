import React, { useEffect, useRef, useMemo } from 'react';
import { formatNum } from '../helpers/formatter';
import * as echarts from 'echarts';
import { getInterval, judgeInterval } from '../helpers/judge-interval';

/**
 * Theme configuration for Bars component
 */
export interface BarsTheme {
  /**
   * Foreground color
   */
  FG_COLOR: string;
  /**
   * Background color
   */
  BG_COLOR: string;
  /**
   * Color palette for series
   */
  PALLET: string[];
}

/**
 * Time series data type
 */
export type TimeSeriesData = [string, number][];

/**
 * Chart click event parameters
 */
export interface ChartClickParams {
  /**
   * Series name
   */
  seriesName: string;
  /**
   * Data point
   */
  data: [string, number];
  /**
   * Data index
   */
  dataIndex: number;
  /**
   * Marker symbol
   */
  marker: string;
}

/**
 * Bars component props
 */
export interface BarsProps {
  /**
   * Theme mode
   */
  theme: 'light' | 'dark';
  /**
   * Height of the chart in pixels
   */
  height: number;
  /**
   * Legend text for first series
   */
  legend1: string;
  /**
   * Legend text for second series
   */
  legend2: string;
  /**
   * Y-axis name for first series
   */
  yName1: string;
  /**
   * Y-axis name for second series
   */
  yName2: string;
  /**
   * Data for first series
   */
  data1: TimeSeriesData;
  /**
   * Data for second series
   */
  data2: TimeSeriesData;
  /**
   * Click event handler
   * @param params Click event parameters
   */
  onClick?: (params: ChartClickParams) => void;
}

/**
 * Light theme configuration
 */
const LIGHT_THEME: BarsTheme = {
  FG_COLOR: '#24292f',
  BG_COLOR: '#ffffff',
  PALLET: ['#5470c6', '#91cc75'],
};

/**
 * Dark theme configuration
 */
const DARK_THEME: BarsTheme = {
  FG_COLOR: '#c9d1d9',
  BG_COLOR: '#0d1118',
  PALLET: ['#58a6ff', '#3fb950'],
};

/**
 * Tooltip formatter function
 * @param params ECharts tooltip parameters
 * @returns Formatted tooltip HTML string
 */
const tooltipFormatter = (params: any): string => {
  if (!params) {
    return '';
  }

  const res = `${params.seriesName} (${params.data[0]})<br/>
  ${params.marker}  ${(params.data[1] as number).toFixed(2)}`;
  return res;
};

/**
 * Bars component for displaying dual-series bar charts
 */
const Bars: React.FC<BarsProps> = ({ theme, height, legend1, legend2, yName1, yName2, data1, data2, onClick }) => {
  const { timeLength, minInterval } = getInterval(data1);
  const divRef = useRef<HTMLDivElement>(null);

  /**
   * Get theme configuration based on theme mode
   */
  const themeConfig = useMemo(() => {
    return theme === 'light' ? LIGHT_THEME : DARK_THEME;
  }, [theme]);

  /**
   * Handle chart click event
   * @param params ECharts click event parameters
   */
  const handleChartClick = (params: any): void => {
    if (onClick) {
      onClick(params as ChartClickParams);
    }
  };

  /**
   * ECharts option configuration
   */
  const option = useMemo(
    (): echarts.EChartsOption => ({
      color: themeConfig.PALLET,
      legend: {
        data: [legend1, legend2],
        textStyle: {
          color: themeConfig.FG_COLOR,
        },
      },
      tooltip: {
        textStyle: {
          color: themeConfig.FG_COLOR,
        },
        backgroundColor: themeConfig.BG_COLOR,
        formatter: tooltipFormatter,
      },
      xAxis: {
        type: 'time',
        // 30 * 3600 * 24 * 1000 milliseconds
        minInterval: minInterval,
        splitLine: {
          show: false,
        },
        axisLabel: {
          color: themeConfig.FG_COLOR,
          formatter: {
            year: '{yearStyle|{yy}}',
            month: '{MMM}',
          },
          rich: {
            yearStyle: {
              fontWeight: 'bold',
            },
          },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: yName1,
          nameTextStyle: {
            color: themeConfig.FG_COLOR,
          },
          position: 'left',
          axisLine: {
            show: true,
          },
          axisLabel: {
            formatter: formatNum,
          },
        },
        {
          type: 'value',
          name: yName2,
          nameTextStyle: {
            color: themeConfig.FG_COLOR,
          },
          position: 'right',
          axisLine: {
            show: true,
          },
          axisLabel: {
            formatter: formatNum,
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0],
          yAxisIndex: [0, 1],
          start: 0,
          end: 100,
          minValueSpan: 3600 * 24 * 1000 * 180,
        },
      ],
      series: [
        {
          name: legend1,
          type: 'bar',
          data: data1,
          emphasis: {
            focus: 'series',
          },
          yAxisIndex: 0,
          animationDelay: (idx: number): number => {
            return idx * 10;
          },
        },
        {
          name: legend2,
          type: 'bar',
          data: data2,
          emphasis: {
            focus: 'series',
          },
          yAxisIndex: 1,
          animationDelay: (idx: number): number => {
            return idx * 10 + 100;
          },
        },
      ],
      animationEasing: 'elasticOut',
      animationDelayUpdate: (idx: number): number => {
        return idx * 5;
      },
    }),
    [data1, data2, legend1, legend2, themeConfig, yName1, yName2, minInterval]
  );

  /**
   * Initialize ECharts instance
   */
  useEffect(() => {
    const chartDOM = divRef.current;
    if (!chartDOM) return;

    const instance = echarts.init(chartDOM);

    return () => {
      instance.dispose();
    };
  }, []);

  /**
   * Update chart when option, onClick, or timeLength changes
   */
  useEffect(() => {
    const chartDOM = divRef.current;
    if (!chartDOM) return;

    const instance = echarts.getInstanceByDom(chartDOM);
    if (!instance) return;

    judgeInterval(instance, timeLength);
    instance.setOption(option);

    let clickHandler: echarts.ECElementEventResponder<echarts.ECElementEvent> | undefined;
    if (onClick) {
      clickHandler = handleChartClick;
      instance.on('click', clickHandler);
    }

    return () => {
      if (clickHandler) {
        instance.off('click', clickHandler);
      }
    };
  }, [option, onClick, timeLength]);

  return <div ref={divRef} style={{ width: '100%', height }}></div>;
};

export default Bars;
