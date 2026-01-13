/**
 * Monthly data generation utilities
 * @zh-CN 月度数据生成工具
 *
 * Months with value of 0 are not listed in data file for size optimization
 * purpose, this function inserts those missing values.
 */

/**
 * Original data type with month keys and numeric values
 */
export interface MonthlyDataInput {
  [key: string]: number;
}

/**
 * Month-value pair type
 */
export type MonthValuePair = [string, number];

/**
 * Quarterly data type
 */
export type QuarterValuePair = [string, number];

/**
 * Supported date formats for month keys
 */
export type DateFormat = 'YYYY-MM' | 'YYYY/MM' | 'MM/YYYY';

/**
 * Output format options for generated data
 */
export type OutputFormat = 'array' | 'object' | 'map';

/**
 * Options for generating monthly data
 */
export interface GenerateMonthlyDataOptions {
  /**
   * Meta file last updated time in milliseconds
   * If provided, the end month will be based on this time
   */
  updatedAt?: number;
  /**
   * Value to use for missing months (default: 0)
   */
  fillValue?: number;
  /**
   * Date format to use for month keys (default: "YYYY-MM")
   */
  dateFormat?: DateFormat;
  /**
   * Start month in "YYYY-MM" format
   * If not provided, the earliest month in originalData will be used
   */
  startMonth?: string;
  /**
   * End month in "YYYY-MM" format
   * If not provided, the latest month in originalData or updatedAt will be used
   */
  endMonth?: string;
  /**
   * Whether to sort the result by month (default: true)
   */
  sortByMonth?: boolean;
  /**
   * Output format for the result (default: "array")
   */
  outputFormat?: OutputFormat;
}

/**
 * Monthly data statistics
 */
export interface MonthlyDataStats {
  /** Total sum of all values */
  sum: number;
  /** Average value */
  average: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Number of months with data */
  count: number;
  /** Number of months with non-zero values */
  nonZeroCount: number;
  /** First month with data */
  firstMonth: string;
  /** Last month with data */
  lastMonth: string;
}

/**
 * Validate if a string is a valid month format (YYYY-MM)
 * @param monthStr The month string to validate
 * @returns True if the string is in valid YYYY-MM format
 * @example
 * ```ts
 * isValidMonthFormat("2023-01"); // true
 * isValidMonthFormat("2023-13"); // false (invalid month)
 * isValidMonthFormat("23-01"); // false (invalid year)
 * ```
 */
export const isValidMonthFormat = (monthStr: string): boolean => {
  // Check basic format YYYY-MM
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(monthStr)) {
    return false;
  }

  // Check if month is between 01 and 12
  const [year, month] = monthStr.split('-').map(Number);
  return month >= 1 && month <= 12;
};

/**
 * Parse a month string in YYYY-MM format to a Date object
 * @param monthStr The month string to parse
 * @returns Date object representing the first day of the month
 * @throws Error if the month string is invalid
 */
export const parseMonthString = (monthStr: string): Date => {
  if (!isValidMonthFormat(monthStr)) {
    throw new Error(`Invalid month format: ${monthStr}. Expected format: YYYY-MM`);
  }

  return new Date(`${monthStr}-01`);
};

/**
 * Format a Date object to the specified date format
 * @param date The Date object to format
 * @param format The date format to use (default: "YYYY-MM")
 * @returns String in the specified format
 */
export const formatDateToMonth = (date: Date, format: DateFormat = 'YYYY-MM'): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  switch (format) {
    case 'YYYY/MM':
      return `${year}/${month}`;
    case 'MM/YYYY':
      return `${month}/${year}`;
    case 'YYYY-MM':
    default:
      return `${year}-${month}`;
  }
};

/**
 * Parse a month string in any supported format to a Date object
 * @param monthStr The month string to parse
 * @returns Date object representing the first day of the month
 * @throws Error if the month string is invalid
 */
export const parseMonthStringToDate = (monthStr: string): Date => {
  // Normalize different formats to YYYY-MM
  let normalizedMonthStr = monthStr;

  // Handle YYYY/MM format
  if (/^\d{4}\/\d{2}$/.test(monthStr)) {
    normalizedMonthStr = monthStr.replace('/', '-');
  }
  // Handle MM/YYYY format
  else if (/^\d{2}\/\d{4}$/.test(monthStr)) {
    const [month, year] = monthStr.split('/');
    normalizedMonthStr = `${year}-${month}`;
  }

  if (!isValidMonthFormat(normalizedMonthStr)) {
    throw new Error(`Invalid month format: ${monthStr}. Expected format: YYYY-MM, YYYY/MM, or MM/YYYY`);
  }

  return new Date(`${normalizedMonthStr}-01`);
};

/**
 * Generate monthly data with missing months filled
 * @param originalData Object with month keys (YYYY-MM) and numeric values
 * @param options Optional configuration options
 * @returns Array of [month, value] pairs with missing months filled
 * @example
 * ```ts
 * // Basic usage with default options
 * const data = generateMonthlyData({ "2023-01": 10, "2023-03": 20 });
 * // Returns: [ ["2023-01", 10], ["2023-02", 0], ["2023-03", 20] ]
 *
 * // Custom fill value
 * const data = generateMonthlyData({ "2023-01": 10 }, { fillValue: 5 });
 * // Returns: [ ["2023-01", 10], ["2023-02", 5], ... ]
 *
 * // Custom date range
 * const data = generateMonthlyData(
 *   { "2023-01": 10 },
 *   { startMonth: "2022-12", endMonth: "2023-02" }
 * );
 * // Returns: [ ["2022-12", 0], ["2023-01", 10], ["2023-02", 0] ]
 * ```
 */
export const generateMonthlyData = (
  originalData: MonthlyDataInput | null | undefined,
  options: GenerateMonthlyDataOptions = {}
): MonthValuePair[] | Record<string, number> | Map<string, number> => {
  // Validate input data
  if (originalData === null || originalData === undefined) {
    // Return appropriate empty value based on output format
    const outputFormat = options.outputFormat || 'array';
    switch (outputFormat) {
      case 'object':
        return {};
      case 'map':
        return new Map();
      case 'array':
      default:
        return [];
    }
  }

  if (typeof originalData !== 'object' || Array.isArray(originalData)) {
    throw new TypeError('originalData must be a plain object');
  }

  // Extract options with defaults
  const {
    updatedAt,
    fillValue = 0,
    dateFormat = 'YYYY-MM',
    startMonth,
    endMonth,
    sortByMonth = true,
    outputFormat = 'array',
  } = options;

  // Validate options
  if (updatedAt !== undefined && typeof updatedAt !== 'number') {
    throw new TypeError('updatedAt must be a number');
  }

  if (typeof fillValue !== 'number' || isNaN(fillValue)) {
    throw new TypeError('fillValue must be a valid number');
  }

  // Helper function to parse any supported month format
  const safeParseMonth = (monthStr: string): Date | null => {
    try {
      return parseMonthStringToDate(monthStr);
    } catch {
      return null;
    }
  };

  // Filter original data to only include valid month keys
  const validMonthEntries = Object.entries(originalData)
    .map(([key, value]) => {
      const date = safeParseMonth(key);
      if (date) {
        // Normalize all keys to YYYY-MM for internal processing
        return [formatDateToMonth(date, 'YYYY-MM'), value] as MonthValuePair;
      }
      return null;
    })
    .filter((entry): entry is MonthValuePair => entry !== null);

  // If no valid months found, return appropriate empty value
  if (validMonthEntries.length === 0) {
    switch (outputFormat) {
      case 'object':
        return {};
      case 'map':
        return new Map();
      case 'array':
      default:
        return [];
    }
  }

  // Sort valid entries by month
  const sortedEntries = validMonthEntries.sort(([a], [b]) => {
    const dateA = parseMonthStringToDate(a);
    const dateB = parseMonthStringToDate(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Determine start and end dates
  const defaultStartMonth = sortedEntries[0][0];

  let defaultEndMonth: string;
  if (updatedAt) {
    const updatedDate = new Date(updatedAt);
    // Set to last day of previous month to get correct month for end date
    updatedDate.setDate(0);
    defaultEndMonth = formatDateToMonth(updatedDate, 'YYYY-MM');
  } else {
    defaultEndMonth = sortedEntries[sortedEntries.length - 1][0];
  }

  const resolvedStartMonth = startMonth || defaultStartMonth;
  const resolvedEndMonth = endMonth || defaultEndMonth;

  // Validate that start month is not after end month
  const startDate = safeParseMonth(resolvedStartMonth);
  const endDate = safeParseMonth(resolvedEndMonth);

  if (!startDate || !endDate) {
    throw new Error(`Invalid month format. Expected format: YYYY-MM, YYYY/MM, or MM/YYYY`);
  }

  if (startDate > endDate) {
    throw new Error(`startMonth (${resolvedStartMonth}) cannot be after endMonth (${resolvedEndMonth})`);
  }

  // Create a map for quick lookup of original values
  const originalValuesMap = new Map(validMonthEntries);

  // Generate all months between start and end
  const arrayResult: MonthValuePair[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Get YYYY-MM format for lookup
    const lookupKey = formatDateToMonth(currentDate, 'YYYY-MM');
    // Get the final formatted key based on requested format
    const monthKey = formatDateToMonth(currentDate, dateFormat);
    const value = originalValuesMap.get(lookupKey) || fillValue;

    arrayResult.push([monthKey, value]);

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Sort by month if requested (should already be sorted, but just in case)
  if (sortByMonth) {
    arrayResult.sort(([a], [b]) => {
      const dateA = safeParseMonth(a);
      const dateB = safeParseMonth(b);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Convert to requested output format
  switch (outputFormat) {
    case 'object':
      return Object.fromEntries(arrayResult);
    case 'map':
      return new Map(arrayResult);
    case 'array':
    default:
      return arrayResult;
  }
};

/**
 * Generate quarterly data from monthly data
 * @param monthlyData Monthly data array to convert
 * @returns Quarterly data array with summed values for each quarter
 * @example
 * ```ts
 * const monthly = [ ["2023-01", 10], ["2023-02", 20], ["2023-03", 30] ];
 * const quarterly = generateQuarterlyData(monthly);
 * // Returns: [ ["2023-Q1", 60] ]
 * ```
 */
export const generateQuarterlyData = (monthlyData: MonthValuePair[]): QuarterValuePair[] => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return [];
  }

  // Group monthly data by quarter
  const quarterMap = new Map<string, number>();

  monthlyData.forEach(([monthKey, value]) => {
    try {
      // Parse month to get year and quarter
      const date = parseMonthStringToDate(monthKey);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `${year}-Q${quarter}`;

      // Sum values for the quarter
      const currentSum = quarterMap.get(quarterKey) || 0;
      quarterMap.set(quarterKey, currentSum + value);
    } catch {
      // Skip invalid month keys
    }
  });

  // Convert map to array and sort by quarter
  return Array.from(quarterMap.entries()).sort(([a], [b]) => a.localeCompare(b));
};

/**
 * Calculate statistics for monthly data
 * @param monthlyData Monthly data array to analyze
 * @returns Statistics object containing sum, average, min, max, etc.
 * @example
 * ```ts
 * const monthly = [ ["2023-01", 10], ["2023-02", 20], ["2023-03", 30] ];
 * const stats = calculateMonthlyStats(monthly);
 * // Returns: {
 * //   sum: 60,
 * //   average: 20,
 * //   min: 10,
 * //   max: 30,
 * //   count: 3,
 * //   nonZeroCount: 3,
 * //   firstMonth: "2023-01",
 * //   lastMonth: "2023-03"
 * // }
 * ```
 */
export const calculateMonthlyStats = (monthlyData: MonthValuePair[]): MonthlyDataStats => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return {
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
      count: 0,
      nonZeroCount: 0,
      firstMonth: '',
      lastMonth: '',
    };
  }

  // Extract values and months
  const values = monthlyData.map(([, value]) => value);
  const months = monthlyData.map(([month]) => month);

  // Calculate statistics
  const sum = values.reduce((acc, val) => acc + val, 0);
  const count = values.length;
  const average = count > 0 ? sum / count : 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const nonZeroCount = values.filter((val) => val !== 0).length;
  const firstMonth = months.sort()[0];
  const lastMonth = months.sort().reverse()[0];

  return {
    sum,
    average,
    min,
    max,
    count,
    nonZeroCount,
    firstMonth,
    lastMonth,
  };
};

/**
 * Merge multiple monthly data sources into one
 * @param dataSources Array of monthly data objects to merge
 * @param options Merging options
 * @param options.fillValue Value to use for missing months (default: 0)
 * @param options.mergeStrategy Strategy to use when merging values (default: "sum")
 * @returns Merged monthly data array
 * @example
 * ```ts
 * const data1 = { "2023-01": 10, "2023-02": 20 };
 * const data2 = { "2023-02": 30, "2023-03": 40 };
 * const merged = mergeMonthlyData([data1, data2]);
 * // Returns: [ ["2023-01", 10], ["2023-02", 50], ["2023-03", 40] ]
 * ```
 */
export const mergeMonthlyData = (
  dataSources: MonthlyDataInput[],
  options: {
    fillValue?: number;
    mergeStrategy?: 'sum' | 'average' | 'max' | 'min';
  } = {}
): MonthValuePair[] => {
  if (!Array.isArray(dataSources) || dataSources.length === 0) {
    return [];
  }

  const { fillValue = 0, mergeStrategy = 'sum' } = options;
  const mergedMap = new Map<string, number[]>();

  // Collect all values by month
  dataSources.forEach((data) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      Object.entries(data).forEach(([monthKey, value]) => {
        try {
          // Only include valid month keys
          parseMonthStringToDate(monthKey);
          const values = mergedMap.get(monthKey) || [];
          values.push(value);
          mergedMap.set(monthKey, values);
        } catch {
          // Skip invalid month keys
        }
      });
    }
  });

  // Apply merge strategy to each month
  const mergedData: MonthValuePair[] = [];
  mergedMap.forEach((values, monthKey) => {
    let result: number;

    switch (mergeStrategy) {
      case 'average':
        result = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'sum':
      default:
        result = values.reduce((acc, val) => acc + val, 0);
        break;
    }

    mergedData.push([monthKey, result]);
  });

  // Sort by month
  return mergedData.sort(([a], [b]) => {
    const dateA = parseMonthStringToDate(a);
    const dateB = parseMonthStringToDate(b);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Filter monthly data based on date range
 * @param monthlyData Monthly data array to filter
 * @param startMonth Start month in any supported format
 * @param endMonth End month in any supported format
 * @returns Filtered monthly data array
 * @example
 * ```ts
 * const data = [ ["2023-01", 10], ["2023-02", 20], ["2023-03", 30] ];
 * const filtered = filterMonthlyData(data, "2023-01", "2023-02");
 * // Returns: [ ["2023-01", 10], ["2023-02", 20] ]
 * ```
 */
export const filterMonthlyData = (
  monthlyData: MonthValuePair[],
  startMonth: string,
  endMonth: string
): MonthValuePair[] => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return [];
  }

  try {
    const startDate = parseMonthStringToDate(startMonth);
    const endDate = parseMonthStringToDate(endMonth);

    return monthlyData.filter(([monthKey]) => {
      try {
        const currentDate = parseMonthStringToDate(monthKey);
        return currentDate >= startDate && currentDate <= endDate;
      } catch {
        return false;
      }
    });
  } catch {
    // Return original data if invalid dates provided
    return monthlyData;
  }
};

/**
 * Convert monthly data to cumulative values
 * @param monthlyData Monthly data array to convert
 * @returns Monthly data array with cumulative values
 * @example
 * ```ts
 * const data = [ ["2023-01", 10], ["2023-02", 20], ["2023-03", 30] ];
 * const cumulative = convertToCumulative(monthlyData);
 * // Returns: [ ["2023-01", 10], ["2023-02", 30], ["2023-03", 60] ]
 * ```
 */
export const convertToCumulative = (monthlyData: MonthValuePair[]): MonthValuePair[] => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return [];
  }

  let cumulativeSum = 0;
  return monthlyData.map(([monthKey, value]) => {
    cumulativeSum += value;
    return [monthKey, cumulativeSum] as MonthValuePair;
  });
};

/**
 * @deprecated Use generateMonthlyData instead
 */
const generateDataByMonth = generateMonthlyData;

export default generateMonthlyData;
