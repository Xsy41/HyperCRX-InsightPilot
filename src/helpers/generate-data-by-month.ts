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
   * Currently only "YYYY-MM" is supported
   */
  dateFormat?: "YYYY-MM";
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
  const [year, month] = monthStr.split("-").map(Number);
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
 * Format a Date object to YYYY-MM format
 * @param date The Date object to format
 * @returns String in YYYY-MM format
 */
export const formatDateToMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
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
): MonthValuePair[] => {
  // Validate input data
  if (originalData === null || originalData === undefined) {
    return [];
  }

  if (typeof originalData !== "object" || Array.isArray(originalData)) {
    throw new TypeError("originalData must be a plain object");
  }

  // Extract options with defaults
  const {
    updatedAt,
    fillValue = 0,
    dateFormat = "YYYY-MM",
    startMonth,
    endMonth,
    sortByMonth = true,
  } = options;

  // Validate options
  if (updatedAt !== undefined && typeof updatedAt !== "number") {
    throw new TypeError("updatedAt must be a number");
  }

  if (typeof fillValue !== "number" || isNaN(fillValue)) {
    throw new TypeError("fillValue must be a valid number");
  }

  if (startMonth && !isValidMonthFormat(startMonth)) {
    throw new Error(`Invalid startMonth format: ${startMonth}. Expected format: YYYY-MM`);
  }

  if (endMonth && !isValidMonthFormat(endMonth)) {
    throw new Error(`Invalid endMonth format: ${endMonth}. Expected format: YYYY-MM`);
  }

  // Only YYYY-MM format is supported currently
  if (dateFormat !== "YYYY-MM") {
    throw new Error(`Unsupported dateFormat: ${dateFormat}. Only "YYYY-MM" is supported.`);
  }

  // Filter original data to only include valid month keys
  const validMonthEntries = Object.entries(originalData).filter(([key]) =>
    isValidMonthFormat(key)
  );

  // If no valid months found, return empty array
  if (validMonthEntries.length === 0) {
    return [];
  }

  // Sort valid entries by month
  const sortedEntries = validMonthEntries.sort(([a], [b]) => {
    const dateA = parseMonthString(a);
    const dateB = parseMonthString(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Determine start and end dates
  const defaultStartMonth = sortedEntries[0][0];
  
  let defaultEndMonth: string;
  if (updatedAt) {
    const updatedDate = new Date(updatedAt);
    // Set to last day of previous month to get correct month for end date
    updatedDate.setDate(0);
    defaultEndMonth = formatDateToMonth(updatedDate);
  } else {
    defaultEndMonth = sortedEntries[sortedEntries.length - 1][0];
  }

  const resolvedStartMonth = startMonth || defaultStartMonth;
  const resolvedEndMonth = endMonth || defaultEndMonth;

  // Validate that start month is not after end month
  const startDate = parseMonthString(resolvedStartMonth);
  const endDate = parseMonthString(resolvedEndMonth);
  
  if (startDate > endDate) {
    throw new Error(`startMonth (${resolvedStartMonth}) cannot be after endMonth (${resolvedEndMonth})`);
  }

  // Create a map for quick lookup of original values
  const originalValuesMap = new Map(validMonthEntries);

  // Generate all months between start and end
  const result: MonthValuePair[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const monthKey = formatDateToMonth(currentDate);
    const value = originalValuesMap.get(monthKey) || fillValue;
    
    result.push([monthKey, value]);

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Sort by month if requested (should already be sorted, but just in case)
  if (sortByMonth) {
    result.sort(([a], [b]) => {
      const dateA = parseMonthString(a);
      const dateB = parseMonthString(b);
      return dateA.getTime() - dateB.getTime();
    });
  }

  return result;
};

/**
 * @deprecated Use generateMonthlyData instead
 */
const generateDataByMonth = generateMonthlyData;

export default generateMonthlyData;
