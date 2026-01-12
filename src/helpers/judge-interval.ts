/**
 * Time constants in milliseconds
 */
const MS_IN_DAY = 24 * 3600 * 1000;
const MS_IN_MONTH = 30 * MS_IN_DAY;
const MS_IN_YEAR = 365 * MS_IN_DAY;

/**
 * Time data point type
 */
type TimeDataPoint = [string, number];

/**
 * Chart instance type with minimum required methods
 */
interface ChartInstance {
  on(event: string, callback: (params: any) => void): void;
  getOption(): any;
  setOption(option: any): void;
}

/**
 * Get time interval information from data
 * @param data Array of time data points
 * @returns Object containing time length and minimum interval
 */
export function getInterval(data: TimeDataPoint[]): { timeLength: number; minInterval: number } {
  if (!data || data.length === 0) {
    return { timeLength: 0, minInterval: MS_IN_MONTH };
  }

  // Extract year from the first and last data points
  const startTime = Number(data[0][0].split('-')[0]);
  const endTime = Number(data[data.length - 1][0].split('-')[0]);
  const timeLength = endTime - startTime;

  // Determine minimum interval based on time length
  const minInterval = timeLength > 2 ? MS_IN_YEAR : MS_IN_MONTH;

  return { timeLength, minInterval };
}

/**
 * Judge and set appropriate interval for chart based on time length
 * @param instance Chart instance
 * @param timeLength Time length in years
 */
export function judgeInterval(instance: ChartInstance, timeLength: number): void {
  if (timeLength > 2) {
    instance.on('dataZoom', (params: any) => {
      const chartOption = instance.getOption();
      if (!chartOption || !chartOption.xAxis || !chartOption.xAxis[0]) {
        return;
      }

      const startValue = params.batch?.[0]?.start;
      const endValue = params.batch?.[0]?.end;

      // Set minimum interval based on zoom level
      // If fully zoomed out (0-100), use yearly interval, otherwise use monthly interval
      const minInterval = startValue === 0 && endValue === 100 ? MS_IN_YEAR : MS_IN_MONTH;

      chartOption.xAxis[0].minInterval = minInterval;
      instance.setOption(chartOption);
    });
  }
}
