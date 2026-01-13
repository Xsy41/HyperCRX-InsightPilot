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
  getOption(): ChartOption;
  /**
   * Update chart configuration
   * @param option Chart option object to update
   */
  setOption(option: Partial<ChartOption>): void;
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
 * Chart option type with minimum required properties
 */
export interface ChartOption {
  xAxis?: Array<{
    minInterval?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
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
 * Calculate time interval information from data
 * @param data Array of time data points
 * @returns Object containing time length and recommended minimum interval
 * @throws TypeError if input is invalid
 * @example
 * ```typescript
 * const data = [
 *   ['2020-01-01', 100],
 *   ['2021-01-01', 200],
 *   ['2022-01-01', 300],
 *   ['2023-01-01', 400]
 * ];
 * const { timeLength, minInterval } = getInterval(data);
 * // timeLength = 3 (years)
 * // minInterval = 31536000000 (1 year in ms)
 * ```
 */
export function getInterval(data: TimeDataPoint[]): IntervalResult {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    throw new TypeError('Data must be a non-empty array of time data points');
  }

  try {
    // Validate data format
    for (const [dateStr, value] of data) {
      if (typeof dateStr !== 'string' || typeof value !== 'number') {
        throw new TypeError('Each data point must be a tuple of [string, number]');
      }
    }

    // Extract year from the first and last data points
    const firstDate = data[0][0];
    const lastDate = data[data.length - 1][0];

    const startYear = Number(firstDate.split('-')[0]);
    const endYear = Number(lastDate.split('-')[0]);

    // Validate year values
    if (isNaN(startYear) || isNaN(endYear)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const timeLength = endYear - startYear;

    // Determine minimum interval based on time length
    // Use yearly interval for data spanning more than 2 years, monthly otherwise
    const minInterval = timeLength > 2 ? MS_IN_YEAR : MS_IN_MONTH;

    return { timeLength, minInterval };
  } catch (error) {
    console.error('Error calculating interval:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Set appropriate axis interval for chart based on time length and handle zoom events
 * @param instance Chart instance to configure
 * @param timeLength Time span in years
 * @throws TypeError if input is invalid
 * @example
 * ```typescript
 * const chartInstance = getChartInstance(); // Your chart instance
 * const { timeLength } = getInterval(data);
 * judgeInterval(chartInstance, timeLength);
 * ```
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
    throw new TypeError('Invalid chart instance. Must have on, getOption, and setOption methods');
  }

  // Input validation for timeLength
  if (typeof timeLength !== 'number' || isNaN(timeLength) || timeLength < 0) {
    throw new TypeError('timeLength must be a non-negative number');
  }

  // Only apply special handling for long time periods (more than 2 years)
  if (timeLength <= 2) {
    return;
  }

  // Set up dataZoom event listener
  instance.on('dataZoom', (params: ZoomParams) => {
    try {
      const chartOption = instance.getOption();
      if (!chartOption || typeof chartOption !== 'object') {
        console.error('Invalid chart option returned from getOption');
        return;
      }

      const xAxis = chartOption.xAxis;
      if (!Array.isArray(xAxis) || xAxis.length === 0) {
        console.error('No xAxis configuration found in chart options');
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
      // Use yearly interval when fully zoomed out, monthly otherwise
      const minInterval = startValue === 0 && endValue === 100 ? MS_IN_YEAR : MS_IN_MONTH;

      // Only update if interval has changed
      if (xAxis[0].minInterval === minInterval) {
        return;
      }

      // Update chart with new interval
      instance.setOption({
        xAxis: [
          {
            minInterval,
          },
        ],
      });
    } catch (error) {
      console.error('Error handling dataZoom event:', error instanceof Error ? error.message : String(error));
    }
  });
}
