/**
 * Time constants in milliseconds
 */
export const MS_IN_DAY = 24 * 3600 * 1000;
export const MS_IN_MONTH = 30 * MS_IN_DAY;
export const MS_IN_YEAR = 365 * MS_IN_DAY;

/**
 * Time data point type
 */
export type TimeDataPoint = [string, number];

/**
 * Chart instance type with minimum required methods
 */
export interface ChartInstance {
  on(event: string, callback: (params: any) => void): void;
  getOption(): any;
  setOption(option: any): void;
}

/**
 * Zoom params type
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
  }>;
}

/**
 * Get time interval information from data
 * @param data Array of time data points
 * @returns Object containing time length and minimum interval
 */
export function getInterval(data: TimeDataPoint[]): { timeLength: number; minInterval: number } {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }

  try {
    // Validate data format
    for (const [dateStr, value] of data) {
      if (typeof dateStr !== 'string' || typeof value !== 'number') {
        throw new Error('Invalid data point format');
      }
    }

    // Extract year from the first and last data points
    const firstDate = data[0][0];
    const lastDate = data[data.length - 1][0];

    const startYear = Number(firstDate.split('-')[0]);
    const endYear = Number(lastDate.split('-')[0]);

    // Validate year values
    if (isNaN(startYear) || isNaN(endYear)) {
      throw new Error('Invalid date format');
    }

    const timeLength = endYear - startYear;

    // Determine minimum interval based on time length
    const minInterval = timeLength > 2 ? MS_IN_YEAR : MS_IN_MONTH;

    return { timeLength, minInterval };
  } catch (error) {
    console.error('Error calculating interval:', error);
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }
}

/**
 * Judge and set appropriate interval for chart based on time length
 * @param instance Chart instance
 * @param timeLength Time length in years
 */
export function judgeInterval(instance: ChartInstance, timeLength: number): void {
  // Input validation
  if (
    !instance ||
    typeof instance.on !== 'function' ||
    typeof instance.getOption !== 'function' ||
    typeof instance.setOption !== 'function'
  ) {
    console.error('Invalid chart instance');
    return;
  }

  if (typeof timeLength !== 'number' || isNaN(timeLength)) {
    console.error('Invalid time length');
    return;
  }

  if (timeLength > 2) {
    instance.on('dataZoom', (params: ZoomParams) => {
      try {
        const chartOption = instance.getOption();
        if (!chartOption || typeof chartOption !== 'object') {
          return;
        }

        const xAxis = (chartOption as ChartOption).xAxis;
        if (!Array.isArray(xAxis) || xAxis.length === 0) {
          return;
        }

        const batch = params.batch;
        const startValue = batch?.[0]?.start;
        const endValue = batch?.[0]?.end;

        // Set minimum interval based on zoom level
        // If fully zoomed out (0-100), use yearly interval, otherwise use monthly interval
        const minInterval = startValue === 0 && endValue === 100 ? MS_IN_YEAR : MS_IN_MONTH;

        // Update chart option
        const updatedOption = {
          ...chartOption,
          xAxis: [
            {
              ...xAxis[0],
              minInterval,
            },
            ...xAxis.slice(1),
          ],
        };

        instance.setOption(updatedOption);
      } catch (error) {
        console.error('Error handling dataZoom event:', error);
      }
    });
  }
}
