/**
 * Time constants in milliseconds
 */
export const MS_IN_DAY = 24 * 3600 * 1000;
export const MS_IN_MONTH = 30 * MS_IN_DAY;
export const MS_IN_YEAR = 365 * MS_IN_DAY;

/**
 * Time data point type - tuple of [date string, value]
 */
export type TimeDataPoint = [string, number];

/**
 * Zoom batch type for dataZoom events
 */
export interface ZoomBatch {
  /** Start percentage value (0-100) */
  start: number;
  /** End percentage value (0-100) */
  end: number;
}

/**
 * Zoom parameters type for dataZoom events
 */
export interface ZoomParams {
  /** Array of zoom batches */
  batch?: ZoomBatch[];
}

/**
 * X-axis configuration for chart
 */
export interface XAxisConfig {
  /** Minimum interval for axis ticks in milliseconds */
  minInterval?: number;
  /** Additional properties from chart library */
  [key: string]: any;
}

/**
 * Chart option type with x-axis configuration
 */
export interface ChartOption {
  /** Array of x-axis configurations */
  xAxis?: XAxisConfig[];
  /** Additional properties from chart library */
  [key: string]: any;
}

/**
 * Chart instance interface with required methods
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
 * Interval result type
 */
export interface IntervalResult {
  /** Time length in years */
  timeLength: number;
  /** Minimum recommended interval in milliseconds */
  minInterval: number;
}

/**
 * Calculate appropriate time interval based on data range
 * @param data Array of time data points
 * @returns Object containing time length and recommended minimum interval
 */
export function getInterval(data: TimeDataPoint[]): IntervalResult {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }

  try {
    // Validate data format for all points
    for (let i = 0; i < data.length; i++) {
      const [dateStr, value] = data[i];
      if (typeof dateStr !== 'string' || typeof value !== 'number') {
        throw new Error(`Invalid data point format at index ${i}: expected [string, number]`);
      }
      // Validate date string format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error(`Invalid date format at index ${i}: ${dateStr}. Expected YYYY-MM-DD`);
      }
    }

    // Extract year from the first and last data points
    const firstDate = data[0][0];
    const lastDate = data[data.length - 1][0];

    const startYear = Number(firstDate.split('-')[0]);
    const endYear = Number(lastDate.split('-')[0]);

    // Validate year values
    if (isNaN(startYear) || isNaN(endYear)) {
      throw new Error(`Invalid year extraction: startYear=${startYear}, endYear=${endYear}`);
    }

    const timeLength = endYear - startYear;

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
    console.error('Invalid chart instance: must be an object with on, getOption, and setOption methods');
    return;
  }

  // Input validation for timeLength
  if (typeof timeLength !== 'number' || isNaN(timeLength) || timeLength < 0) {
    console.error(`Invalid timeLength: ${timeLength}. Expected non-negative number`);
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

      // Validate zoom values are within expected range
      if (startValue < 0 || startValue > 100 || endValue < 0 || endValue > 100) {
        console.error(`Invalid zoom values: start=${startValue}, end=${endValue}. Expected 0-100`);
        return;
      }

      // Determine appropriate interval based on zoom level
      // - Fully zoomed out (0-100): use yearly interval for better readability
      // - Zoomed in: use monthly interval for more detailed view
      const minInterval = startValue === 0 && endValue === 100 ? MS_IN_YEAR : MS_IN_MONTH;

      // Only update if the interval has changed
      const currentMinInterval = xAxis[0].minInterval;
      if (currentMinInterval === minInterval) {
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
