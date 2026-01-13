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
export const formatSI = (num: number, options: SIFormatOptions = {}): string => {
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
export const formatCommas = (num: number, options: CommaFormatOptions = {}): string => {
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

export const formatPercentage = (value: number, options: PercentageFormatOptions = {}): string => {
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

export const formatCurrency = (amount: number, options: CurrencyFormatOptions = {}): string => {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }

  const { currency = '$', decimals = 2, symbolPosition = 'prefix', useCommas = true } = options;

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
  return symbolPosition === 'prefix' ? `${currency}${amountWithCommas}` : `${amountWithCommas}${currency}`;
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

/**
 * Options for file size formatting
 */
export interface FileSizeFormatOptions {
  /** Number of decimal places to show (default: 2) */
  decimals?: number;
  /** Whether to remove trailing zeros (default: true) */
  removeTrailingZeros?: boolean;
  /** Unit system to use (default: 'binary' for KiB, MiB, etc.) */
  unitSystem?: 'binary' | 'decimal';
}

/**
 * Formats a file size with appropriate units (B, KB, MB, GB, etc.)
 * @param bytes The file size in bytes
 * @param options Optional configuration options
 * @returns Formatted file size string with appropriate unit
 * @example
 * ```ts
 * // Format with default options (binary units)
 * formatFileSize(1024); // "1.00 KiB"
 *
 * // Format with decimal units
 * formatFileSize(1024, { unitSystem: 'decimal' }); // "1.02 KB"
 *
 * // Format with custom decimals
 * formatFileSize(1536, { decimals: 1 }); // "1.5 KiB"
 * ```
 */
export const formatFileSize = (bytes: number, options: FileSizeFormatOptions = {}): string => {
  // Validate input
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }

  const { decimals = 2, removeTrailingZeros = true, unitSystem = 'binary' } = options;

  // Validate decimals
  if (typeof decimals !== 'number' || decimals < 0 || decimals > 10) {
    throw new TypeError('Decimals must be between 0 and 10');
  }

  // Define units based on system
  const units =
    unitSystem === 'binary'
      ? [
          { value: 1, symbol: 'B' },
          { value: 1024, symbol: 'KiB' },
          { value: 1024 ** 2, symbol: 'MiB' },
          { value: 1024 ** 3, symbol: 'GiB' },
          { value: 1024 ** 4, symbol: 'TiB' },
          { value: 1024 ** 5, symbol: 'PiB' },
        ]
      : [
          { value: 1, symbol: 'B' },
          { value: 1000, symbol: 'KB' },
          { value: 1000 ** 2, symbol: 'MB' },
          { value: 1000 ** 3, symbol: 'GB' },
          { value: 1000 ** 4, symbol: 'TB' },
          { value: 1000 ** 5, symbol: 'PB' },
        ];

  // Find the appropriate unit
  let unitIndex = 0;
  for (let i = units.length - 1; i > 0; i--) {
    if (bytes >= units[i].value) {
      unitIndex = i;
      break;
    }
  }

  // Format the size
  const { value: unitValue, symbol: unitSymbol } = units[unitIndex];
  let formatted = (bytes / unitValue).toFixed(decimals);

  // Remove trailing zeros if enabled
  if (removeTrailingZeros) {
    const trailingZerosRegex = /0+$|([0-9]*[1-9])0+$/;
    formatted = formatted.replace(trailingZerosRegex, '$1');
  }

  return `${formatted} ${unitSymbol}`;
};

/**
 * Options for relative time formatting
 */
export interface RelativeTimeFormatOptions {
  /** Whether to use short format (default: false) */
  short?: boolean;
  /** Whether to show seconds (default: true) */
  showSeconds?: boolean;
}

/**
 * Formats a timestamp as relative time (e.g., "2 hours ago")
 * @param timestamp The timestamp to format (in milliseconds)
 * @param options Optional configuration options
 * @returns Formatted relative time string
 * @example
 * ```ts
 * // Format with default options
 * formatRelativeTime(Date.now() - 3600000); // "1 hour ago"
 *
 * // Format with short format
 * formatRelativeTime(Date.now() - 3600000, { short: true }); // "1h ago"
 *
 * // Format without seconds
 * formatRelativeTime(Date.now() - 60000, { showSeconds: false }); // "1 minute ago"
 * ```
 */
export const formatRelativeTime = (timestamp: number, options: RelativeTimeFormatOptions = {}): string => {
  // Validate input
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return '';
  }

  const { short = false, showSeconds = true } = options;
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(Math.abs(diff) / 1000);

  // Define time intervals
  const intervals = [
    { value: 31536000, long: 'year', short: 'y' },
    { value: 2592000, long: 'month', short: 'mo' },
    { value: 86400, long: 'day', short: 'd' },
    { value: 3600, long: 'hour', short: 'h' },
    { value: 60, long: 'minute', short: 'm' },
    { value: 1, long: 'second', short: 's' },
  ];

  // Find the appropriate interval
  let intervalIndex = 0;
  for (let i = 0; i < intervals.length; i++) {
    if (seconds >= intervals[i].value) {
      intervalIndex = i;
      break;
    }
  }

  const interval = intervals[intervalIndex];
  const count = Math.floor(seconds / interval.value);
  const isFuture = diff < 0;

  // Build the result
  const unit = short ? interval.short : `${interval.long}${count !== 1 ? 's' : ''}`;
  const prefix = short ? '' : count !== 1 ? `${count} ` : '1 ';
  const suffix = short ? ' ' : ' ';
  const direction = isFuture ? 'from now' : 'ago';
  const shortDirection = isFuture ? '' : ' ago';

  return short ? `${count}${unit}${shortDirection}` : `${prefix}${unit}${suffix}${direction}`;
};

/**
 * Options for date formatting
 */
export interface DateFormatOptions {
  /** Date format string (default: 'YYYY-MM-DD') */
  format?: string;
  /** Whether to use local time (default: true) */
  local?: boolean;
}

/**
 * Formats a date according to the specified format
 * @param date The date to format (Date object or timestamp in milliseconds)
 * @param options Optional configuration options
 * @returns Formatted date string
 * @example
 * ```ts
 * // Format with default options
 * formatDate(new Date()); // "2023-12-25"
 *
 * // Format with custom format
 * formatDate(new Date(), { format: 'DD/MM/YYYY' }); // "25/12/2023"
 *
 * // Format with timestamp input
 * formatDate(Date.now(), { format: 'YYYY-MM-DD HH:mm' }); // "2023-12-25 14:30"
 * ```
 */
export const formatDate = (date: Date | number, options: DateFormatOptions = {}): string => {
  // Validate input
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }

  const { format = 'YYYY-MM-DD', local = true } = options;

  // Helper functions to get date parts
  const getYear = () => (local ? d.getFullYear() : d.getUTCFullYear());
  const getMonth = () => (local ? d.getMonth() + 1 : d.getUTCMonth() + 1);
  const getDate = () => (local ? d.getDate() : d.getUTCDate());
  const getHours = () => (local ? d.getHours() : d.getUTCHours());
  const getMinutes = () => (local ? d.getMinutes() : d.getUTCMinutes());
  const getSeconds = () => (local ? d.getSeconds() : d.getUTCSeconds());

  // Helper to pad with leading zero
  const pad = (num: number) => num.toString().padStart(2, '0');

  // Replace format placeholders
  return format
    .replace('YYYY', getYear().toString())
    .replace('MM', pad(getMonth()))
    .replace('DD', pad(getDate()))
    .replace('HH', pad(getHours()))
    .replace('mm', pad(getMinutes()))
    .replace('ss', pad(getSeconds()));
};

/**
 * Options for time formatting
 */
export interface TimeFormatOptions {
  /** Whether to use 24-hour format (default: true) */
  use24Hour?: boolean;
  /** Whether to show seconds (default: false) */
  showSeconds?: boolean;
}

/**
 * Formats a time according to the specified options
 * @param date The date to format (Date object or timestamp in milliseconds)
 * @param options Optional configuration options
 * @returns Formatted time string
 * @example
 * ```ts
 * // Format with default options (24-hour, no seconds)
 * formatTime(new Date(2023, 11, 25, 14, 30, 45)); // "14:30"
 *
 * // Format with 12-hour format
 * formatTime(new Date(2023, 11, 25, 14, 30), { use24Hour: false }); // "2:30 PM"
 *
 * // Format with seconds
 * formatTime(new Date(2023, 11, 25, 14, 30, 45), { showSeconds: true }); // "14:30:45"
 * ```
 */
export const formatTime = (date: Date | number, options: TimeFormatOptions = {}): string => {
  // Validate input
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }

  const { use24Hour = true, showSeconds = false } = options;
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  // Handle 12-hour format
  const period = use24Hour ? '' : hours >= 12 ? ' PM' : ' AM';
  if (!use24Hour) {
    hours = hours % 12 || 12;
  }

  // Helper to pad with leading zero
  const pad = (num: number) => num.toString().padStart(2, '0');

  // Build the result
  let result = `${pad(hours)}:${pad(minutes)}`;
  if (showSeconds) {
    result += `:${pad(seconds)}`;
  }
  result += period;

  return result;
};

/**
 * Formats a version string for display
 * @param version The version string to format
 * @returns Formatted version string
 * @example
 * ```ts
 * // Format with default options
 * formatVersion('1.0.0-beta.1'); // "v1.0.0-beta.1"
 *
 * // Format already prefixed version
 * formatVersion('v2.0.0'); // "v2.0.0"
 * ```
 */
export const formatVersion = (version: string): string => {
  // Validate input
  if (typeof version !== 'string') {
    return '';
  }

  // Ensure version has 'v' prefix
  return version.startsWith('v') ? version : `v${version}`;
};

/**
 * Formats a phone number with appropriate formatting
 * @param phoneNumber The phone number to format
 * @param countryCode The country code (default: 'US')
 * @returns Formatted phone number string
 * @example
 * ```ts
 * // Format US phone number
 * formatPhoneNumber('1234567890'); // "(123) 456-7890"
 *
 * // Format with country code
 * formatPhoneNumber('1234567890', 'US'); // "+1 (123) 456-7890"
 * ```
 */
export const formatPhoneNumber = (phoneNumber: string, countryCode: string = 'US'): string => {
  // Validate input
  if (typeof phoneNumber !== 'string') {
    return '';
  }

  // Remove non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle US phone numbers
  if (countryCode === 'US') {
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
  }

  // Return as-is if no formatting rule matches
  return phoneNumber;
};

/**
 * Formats a percentage difference between two numbers
 * @param oldValue The old value
 * @param newValue The new value
 * @param decimals Number of decimal places to show (default: 1)
 * @returns Formatted percentage difference string with sign
 * @example
 * ```ts
 * // Format with default options
 * formatPercentageChange(100, 120); // "+20.0%"
 *
 * // Format with custom decimals
 * formatPercentageChange(100, 115.5, 0); // "+16%"
 *
 * // Format for decrease
 * formatPercentageChange(120, 100); // "-16.7%"
 * ```
 */
export const formatPercentageChange = (oldValue: number, newValue: number, decimals: number = 1): string => {
  // Validate input
  if (typeof oldValue !== 'number' || typeof newValue !== 'number' || isNaN(oldValue) || isNaN(newValue)) {
    return '0.0%';
  }

  // Handle division by zero
  if (oldValue === 0) {
    return newValue > 0 ? '+100.0%' : '0.0%';
  }

  const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  const formatted = Math.abs(change).toFixed(decimals);
  const sign = change > 0 ? '+' : '';

  return `${sign}${formatted}%`;
};
