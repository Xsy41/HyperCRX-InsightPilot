/**
 * Number formatting utilities
 * @zh-CN 数字格式化工具
 */

/**
 * Options for SI unit formatting
 */
export interface SIFormatOptions {
  /** Number of decimal places to show (default: 2) */
  decimals?: number;
  /** Whether to remove trailing zeros (default: true) */
  removeTrailingZeros?: boolean;
  /** SI unit configuration (default: standard SI units) */
  siUnits?: Array<{ value: number; symbol: string }>;
}

/**
 * Formats a number with SI units (k, M, G, etc.)
 * @param num The number to format
 * @param options Optional configuration options
 * @returns Formatted number string with appropriate SI unit
 * @example
 * ```ts
 * // Format with default options
 * formatSI(1234); // "1.23k"
 * 
 * // Format with custom decimals
 * formatSI(1234, { decimals: 1 }); // "1.2k"
 * 
 * // Format without removing trailing zeros
 * formatSI(1000, { removeTrailingZeros: false }); // "1.00k"
 * ```
 */
export const formatSI = (
  num: number,
  options: SIFormatOptions = {}
): string => {
  // Validate input
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  const {
    decimals = 2,
    removeTrailingZeros = true,
    siUnits = [
      { value: 1, symbol: '' },
      { value: 1e3, symbol: 'k' },
      { value: 1e6, symbol: 'M' },
      { value: 1e9, symbol: 'G' },
      { value: 1e12, symbol: 'T' },
      { value: 1e15, symbol: 'P' },
      { value: 1e18, symbol: 'E' },
    ],
  } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  // Validate siUnits
  if (!Array.isArray(siUnits) || siUnits.length === 0) {
    throw new TypeError('siUnits must be a non-empty array');
  }

  let isNegative = false;
  if (num < 0) {
    isNegative = true;
    num = Math.abs(num);
  }

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
  let formatted = (num / unitValue).toFixed(decimals);

  // Remove trailing zeros if enabled
  if (removeTrailingZeros) {
    const trailingZerosRegex = /\.0+$|(\.[0-9]*[1-9])0+$/;
    formatted = formatted.replace(trailingZerosRegex, '$1');
  }

  // Add negative sign if needed
  return isNegative ? `-${formatted}${unitSymbol}` : `${formatted}${unitSymbol}`;
};

/**
 * Options for comma-separated number formatting
 */
export interface CommaFormatOptions {
  /** Number of decimal places to show (default: 0) */
  decimals?: number;
  /** Whether to show decimal places even if all are zero (default: false) */
  showDecimalsWhenZero?: boolean;
}

/**
 * Formats a number with comma separators for thousands, millions, etc.
 * @param num The number to format
 * @param options Optional configuration options
 * @returns Formatted number string with commas
 * @example
 * ```ts
 * // Format with default options
 * formatCommas(1234567); // "1,234,567"
 * 
 * // Format with decimals
 * formatCommas(1234.567, { decimals: 2 }); // "1,234.57"
 * 
 * // Format with trailing zeros
 * formatCommas(1000, { decimals: 2, showDecimalsWhenZero: true }); // "1,000.00"
 * ```
 */
export const formatCommas = (
  num: number,
  options: CommaFormatOptions = {}
): string => {
  // Validate input
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  const { decimals = 0, showDecimalsWhenZero = false } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  let formatted: string;
  
  if (decimals > 0) {
    formatted = num.toFixed(decimals);
    
    // Remove decimal part if all zeros and showDecimalsWhenZero is false
    if (!showDecimalsWhenZero) {
      const trailingZerosRegex = /\.0+$/;
      formatted = formatted.replace(trailingZerosRegex, '');
    }
  } else {
    formatted = Math.round(num).toString();
  }

  // Add comma separators
  return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Formats a percentage value
 * @param value The value to format (0-1)
 * @param options Optional configuration options
 * @param options.decimals Number of decimal places to show (default: 2)
 * @param options.showSymbol Whether to show the % symbol (default: true)
 * @returns Formatted percentage string
 * @example
 * ```ts
 * // Format with default options
 * formatPercentage(0.1234); // "12.34%"
 * 
 * // Format with custom decimals
 * formatPercentage(0.1234, { decimals: 1 }); // "12.3%"
 * 
 * // Format without symbol
 * formatPercentage(0.1234, { showSymbol: false }); // "12.34"
 * ```
 */
export interface PercentageFormatOptions {
  /** Number of decimal places to show (default: 2) */
  decimals?: number;
  /** Whether to show the % symbol (default: true) */
  showSymbol?: boolean;
}

export const formatPercentage = (
  value: number,
  options: PercentageFormatOptions = {}
): string => {
  // Validate input
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  const { decimals = 2, showSymbol = true } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  // Convert to percentage and format
  const percentage = value * 100;
  const formatted = percentage.toFixed(decimals);

  return showSymbol ? `${formatted}%` : formatted;
};

/**
 * Formats a number to a fixed number of decimal places
 * @param num The number to format
 * @param decimals Number of decimal places to show (default: 2)
 * @returns Formatted number string
 * @example
 * ```ts
 * // Format with default decimals
 * formatFixed(123.456); // "123.46"
 * 
 * // Format with custom decimals
 * formatFixed(123.456, 1); // "123.5"
 * ```
 */
export const formatFixed = (num: number, decimals: number = 2): string => {
  // Validate input
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  return num.toFixed(decimals);
};

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param options Optional configuration options
 * @param options.currency The currency symbol to use (default: '$')
 * @param options.decimals Number of decimal places to show (default: 2)
 * @param options.symbolPosition Position of the currency symbol (default: 'prefix')
 * @returns Formatted currency string
 * @example
 * ```ts
 * // Format with default options
 * formatCurrency(1234.56); // "$1,234.56"
 * 
 * // Format with custom currency
 * formatCurrency(1234.56, { currency: '€' }); // "€1,234.56"
 * 
 * // Format with symbol suffix
 * formatCurrency(1234.56, { symbolPosition: 'suffix' }); // "1,234.56$"
 * ```
 */
export interface CurrencyFormatOptions {
  /** The currency symbol to use (default: '$') */
  currency?: string;
  /** Number of decimal places to show (default: 2) */
  decimals?: number;
  /** Position of the currency symbol (default: 'prefix') */
  symbolPosition?: 'prefix' | 'suffix';
  /** Whether to use comma separators (default: true) */
  useCommas?: boolean;
}

export const formatCurrency = (
  amount: number,
  options: CurrencyFormatOptions = {}
): string => {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }

  const {
    currency = '$',
    decimals = 2,
    symbolPosition = 'prefix',
    useCommas = true,
  } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  // Format the amount with decimals
  const formattedAmount = amount.toFixed(decimals);
  
  // Add comma separators if enabled
  let amountWithCommas = formattedAmount;
  if (useCommas) {
    amountWithCommas = formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Add currency symbol
  return symbolPosition === 'prefix' 
    ? `${currency}${amountWithCommas}` 
    : `${amountWithCommas}${currency}`;
};

/**
 * @deprecated Use formatSI instead
 */
export const formatNum = formatSI;

/**
 * @deprecated Use formatCommas instead
 */
export const numberWithCommas = (num: number): string => {
  return formatCommas(num);
};
