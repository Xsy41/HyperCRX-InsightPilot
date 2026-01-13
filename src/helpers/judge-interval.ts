/**
 * Chart interval judgment utilities
 * Handles time interval calculations and chart axis interval settings
 * @zh-CN 图表时间间隔判断工具
 *       处理时间间隔计算和图表轴间隔设置
 */

/** Time constants in milliseconds */
export const MS_IN_DAY = 24 * 3600 * 1000;
export const MS_IN_MONTH = 30 * MS_IN_DAY;
export const MS_IN_YEAR = 365 * MS_IN_DAY;

/**
 * Time data point type
 */
export type TimeDataPoint = [string, number];

/**
 * Chart instance interface with minimum required methods
 */
export interface ChartInstance {
  /**
   * Attach event listener to chart
   * @param event Event name to listen for
   * @param callback Function to call when event occurs
   */
  on(event: string, callback: (params: any) => void): void;
  /**
   * Get current chart configuration
   * @returns Current chart option object
   */
  getOption(): any;
  /**
   * Update chart configuration
   * @param option Chart option object to update
   */
  setOption(option: any): void;
}

/**
 * Zoom parameters type for dataZoom events
 */
export interface ZoomParams {
  batch?: Array<{
    start: number;
    end: number;
  }>;
}

/**
 * Interval result type
 */
export interface IntervalResult {
  /** Time length in years */
  timeLength: number;
  /** Minimum recommended interval in milliseconds */
  minInterval: number;
}

/**
 * Get time interval information from data
 * @param data Array of time data points
 * @returns Object containing time length and minimum interval
 */
export function getInterval(data: TimeDataPoint[]): IntervalResult {
  if (!Array.isArray(data) || data.length === 0) {
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }

  try {
    // Validate data format
    for (const [dateStr, value] of data) {
      if (typeof dateStr !== 'string' || typeof value !== 'number') {
        throw new TypeError('Each data point must be a tuple of [string, number]');
      }
    }

    // Extract year from the first and last data points
    const startTime = Number(data[0][0].split('-')[0]);
    const endTime = Number(data[data.length - 1][0].split('-')[0]);
    const timeLength = endTime - startTime;

    // Validate year values
    if (isNaN(startTime) || isNaN(endTime)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Determine minimum interval based on time length
    const minInterval = timeLength > 2 ? MS_IN_YEAR : MS_IN_MONTH;

    return { timeLength, minInterval };
  } catch (error) {
    console.error('Error calculating interval:', error instanceof Error ? error.message : String(error));
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }
}

/**
 * Set appropriate axis interval for chart based on time length and handle zoom events
 * @param instance Chart instance to configure
 * @param timeLength Time span in years
 */
export function judgeInterval(instance: ChartInstance, timeLength: number): void {
  // Input validation for chart instance
  if (
    !instance ||
    typeof instance !== 'object' ||
    typeof instance.on !== 'function' ||
    typeof instance.getOption !== 'function' ||
    typeof instance.setOption !== 'function'
  ) {
    console.error('Invalid chart instance. Must have on, getOption, and setOption methods');
    return;
  }

  // Input validation for timeLength
  if (typeof timeLength !== 'number' || isNaN(timeLength) || timeLength < 0) {
    console.error('timeLength must be a non-negative number');
    return;
  }

  // Only apply special handling for long time periods (more than 2 years)
  if (timeLength <= 2) {
    return;
  }

  // Set up dataZoom event listener
  instance.on('dataZoom', (params: ZoomParams) => {
    try {
      const chartOption = instance.getOption();
      if (!chartOption || !chartOption.xAxis || !chartOption.xAxis[0]) {
        return;
      }

      const batch = params.batch;
      if (!batch || !Array.isArray(batch) || batch.length === 0) {
        return;
      }

      const zoomBatch = batch[0];
      const { start: startValue, end: endValue } = zoomBatch;

      // Validate zoom values
      if (startValue < 0 || startValue > 100 || endValue < 0 || endValue > 100) {
        console.error(`Invalid zoom values: start=${startValue}, end=${endValue}. Expected 0-100`);
        return;
      }

      // Determine appropriate interval based on zoom level
      const minInterval = startValue === 0 && endValue === 100 ? MS_IN_YEAR : MS_IN_MONTH;

      // Only update if interval has changed
      if (chartOption.xAxis[0].minInterval === minInterval) {
        return;
      }

      // Update chart with new interval
      chartOption.xAxis[0].minInterval = minInterval;
      instance.setOption(chartOption);
    } catch (error) {
      console.error('Error handling dataZoom event:', error instanceof Error ? error.message : String(error));
    }
  });
}
