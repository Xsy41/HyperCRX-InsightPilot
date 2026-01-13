/**
 * Formats a number with SI units (k, M, G, etc.)
 * @param num The number to format
 * @param options Optional configuration options
 * @param options.decimals Number of decimal places to show (default: 2)
 * @returns Formatted number string with appropriate SI unit
 */
export const formatNum = (
  num: number,
  options: {
    decimals?: number;
  } = {}
): string => {
  // Validate input
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  const { decimals = 2 } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  let isNegative = false;
  if (num < 0) {
    isNegative = true;
    num = Math.abs(num);
  }

  // Extended SI units for larger numbers
  const siUnits = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
  ];

  // Regular expression to remove trailing zeros after decimal
  const trailingZerosRegex = /\.0+$|(\.[0-9]*[1-9])0+$/;

  // Find the appropriate SI unit
  let unitIndex = 0;
  for (let i = siUnits.length - 1; i > 0; i--) {
    if (num >= siUnits[i].value) {
      unitIndex = i;
      break;
    }
  }

  // Format the number
  const { value: unitValue, symbol: unitSymbol } = siUnits[unitIndex];
  const formatted = (num / unitValue).toFixed(decimals).replace(trailingZerosRegex, '$1');

  // Add negative sign if needed
  return isNegative ? `-${formatted}${unitSymbol}` : `${formatted}${unitSymbol}`;
};

/**
 * Formats a number with comma separators for thousands, millions, etc.
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export const numberWithCommas = (num: number): string => {
  // Validate input
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
