/**
 * Months with value of 0 are not listed in data file for size optimization
 * purpose, this function inserts those missing zeros.
 * @param originalData Object with keys like `2020-01`, `2020-02`, etc.
 * @param updatedAt Meta file last updated time in milliseconds
 * @returns Array of [month, value] pairs with missing months filled with 0
 */
interface OriginalDataType {
  [key: string]: number;
}

type MonthDataPair = [string, number];

/**
 * Check if a key is a normal month format (YYYY-MM)
 * @param key The key to check
 * @returns True if the key is in YYYY-MM format
 */
const isNormalMonth = (key: string): boolean => {
  return /^\d{4}-\d{2}$/.test(key);
};

/**
 * Generate month data with missing months filled with 0
 * @param originalData Object with month keys and values
 * @param updatedAt Optional timestamp for last update
 * @returns Array of [month, value] pairs
 */
const generateDataByMonth = (
  originalData: OriginalDataType | null | undefined,
  updatedAt?: number
): MonthDataPair[] => {
  // Validate input
  if (originalData === null || originalData === undefined) {
    return [];
  }

  if (typeof originalData !== 'object' || Array.isArray(originalData)) {
    throw new TypeError('originalData must be an object');
  }

  if (updatedAt !== undefined && typeof updatedAt !== 'number') {
    throw new TypeError('updatedAt must be a number');
  }

  // Filter and sort normal months (YYYY-MM format)
  const normalMonths = Object.keys(originalData)
    .filter(isNormalMonth)
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

  // If no normal months found, return empty array
  if (normalMonths.length === 0) {
    return [];
  }

  // Get the last available month from updatedAt or current date
  const lastDataAvailableMonth = updatedAt ? new Date(updatedAt) : new Date();
  // Set to last day of previous month to get correct month for newestMonth
  lastDataAvailableMonth.setDate(0);

  const oldestMonth = normalMonths[0];
  const newestMonth = `${lastDataAvailableMonth.getFullYear()}-${(lastDataAvailableMonth.getMonth() + 1).toString().padStart(2, '0')}`;

  // Generate array with all months between oldest and newest
  const result: MonthDataPair[] = [];
  const currentDate = new Date(oldestMonth);
  const endDate = new Date(newestMonth);

  // Loop through each month from oldest to newest
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const value = originalData[monthKey] || 0;
    result.push([monthKey, value]);

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return result;
};

export default generateDataByMonth;
