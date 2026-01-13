/**
 * Linear mapping utilities for converting values between ranges
 * @zh-CN 用于在范围之间转换值的线性映射工具
 */

/**
 * Range type definition
 */
export type Range = [number, number];

/**
 * Easing function type definition
 */
export type EasingFunction = (t: number) => number;

/**
 * Linear map options interface
 */
export interface LinearMapOptions {
  /**
   * Whether to clamp the input value to the domain range (default: true)
   */
  clamp?: boolean;
  /**
   * Whether to invert the mapping (default: false)
   */
  invert?: boolean;
  /**
   * Default value to return if mapping is undefined (e.g., division by zero)
   */
  defaultValue?: number;
  /**
   * Easing function to apply to the mapping (default: linear)
   */
  easing?: EasingFunction;
}

/**
 * Bi-directional mapper interface
 */
export interface BiDirectionalMapper {
  /**
   * Map value from domain to range
   */
  forward: (val: number) => number;
  /**
   * Map value from range to domain
   */
  reverse: (val: number) => number;
}

/**
 * Linear map function to convert a value from one range to another
 * @param val The value to map
 * @param domain The input range [min, max] or a single number representing [0, number]
 * @param range The output range [min, max] or a single number representing [0, number]
 * @param options Mapping options
 * @returns The mapped value
 * @throws TypeError if input types are invalid
 * @throws Error if range formats are invalid
 * @example
 * ```typescript
 * // Basic usage
 * linearMap(50, [0, 100], [0, 1]); // Returns 0.5
 *
 * // Without clamping
 * linearMap(150, [0, 100], [0, 1], { clamp: false }); // Returns 1.5
 *
 * // With inverted mapping
 * linearMap(0.5, [0, 1], [0, 100], { invert: true }); // Returns 50
 *
 * // Using single number ranges (implicit [0, number])
 * linearMap(5, 10, 20); // Maps 5 from [0, 10] to [0, 20] -> Returns 10
 * ```
 */
export function linearMap(
  val: number,
  domain: Range | number,
  range: Range | number,
  options: LinearMapOptions = {}
): number {
  // Extract options with defaults
  const { clamp = true, invert = false, defaultValue, easing } = options;

  // Validate input value type
  if (typeof val !== 'number' || isNaN(val)) {
    throw new TypeError(`Invalid input value: ${val}. Expected a valid number.`);
  }

  // Normalize domain to [min, max] format
  const normalizedDomain = normalizeRange(domain);
  const normalizedRange = normalizeRange(range);

  const [d0, d1] = normalizedDomain;
  const [r0, r1] = normalizedRange;

  // Validate that domain and range contain valid numbers
  validateRange(normalizedDomain, 'domain');
  validateRange(normalizedRange, 'range');

  // Apply inversion if requested
  const [effectiveD0, effectiveD1] = invert ? [d1, d0] : [d0, d1];

  const subDomain = effectiveD1 - effectiveD0;
  const subRange = r1 - r0;

  // Handle division by zero
  if (subDomain === 0) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return subRange === 0 ? r0 : (r0 + r1) / 2;
  }

  // Clamp value to domain boundaries if requested
  let processedVal = val;
  if (clamp) {
    if (subDomain > 0) {
      processedVal = Math.max(effectiveD0, Math.min(effectiveD1, val));
    } else {
      processedVal = Math.min(effectiveD0, Math.max(effectiveD1, val));
    }
  }

  // Calculate normalized 0-1 value for easing
  const normalizedVal = (processedVal - effectiveD0) / subDomain;

  // Apply easing function if provided
  const easedVal = easing ? easing(normalizedVal) : normalizedVal;

  // Calculate final mapped value
  return easedVal * subRange + r0;
}

/**
 * Normalize range input to [min, max] format
 * @param range Range input as [min, max] or a single number
 * @returns Normalized range [min, max]
 */
function normalizeRange(range: Range | number): Range {
  if (typeof range === 'number') {
    return [0, range];
  }

  if (Array.isArray(range)) {
    if (range.length === 1) {
      return [0, range[0]];
    }
    if (range.length === 2) {
      return range;
    }
  }

  throw new Error(`Invalid range format: ${JSON.stringify(range)}. Expected [min, max] or a single number.`);
}

/**
 * Validate that a range contains valid numbers
 * @param range Range to validate
 * @param name Range name for error messages
 */
function validateRange(range: Range, name: string): void {
  const [min, max] = range;

  if (typeof min !== 'number' || isNaN(min) || typeof max !== 'number' || isNaN(max)) {
    throw new TypeError(`${name} must contain only valid numbers. Got: ${JSON.stringify(range)}`);
  }
}

/**
 * Create a reusable linear map function with pre-configured domain and range
 * @param domain The input range [min, max] or a single number
 * @param range The output range [min, max] or a single number
 * @param options Mapping options
 * @returns A function that maps values using the pre-configured settings
 * @example
 * ```typescript
 * // Create a reusable mapper
 * const percentToDecimal = createLinearMapper([0, 100], [0, 1]);
 * percentToDecimal(50); // Returns 0.5
 * percentToDecimal(75); // Returns 0.75
 *
 * // With options
 * const temperatureConverter = createLinearMapper([32, 212], [0, 100], { clamp: true });
 * temperatureConverter(98.6); // Converts Fahrenheit to Celsius -> Returns ~37
 * ```
 */
export function createLinearMapper(
  domain: Range | number,
  range: Range | number,
  options: LinearMapOptions = {}
): (val: number) => number {
  return (val: number) => linearMap(val, domain, range, options);
}

/**
 * Invert a linear mapping
 * @param val The value to invert
 * @param domain The original domain range [min, max]
 * @param range The original output range [min, max]
 * @param options Mapping options (clamp is true by default)
 * @returns The inverted mapped value
 * @example
 * ```typescript
 * // Invert a mapping
 * const original = linearMap(50, [0, 100], [0, 1]); // Returns 0.5
 * const inverted = invertLinearMap(0.5, [0, 100], [0, 1]); // Returns 50
 * ```
 */
export function invertLinearMap(
  val: number,
  domain: Range | number,
  range: Range | number,
  options: Omit<LinearMapOptions, 'invert'> = {}
): number {
  return linearMap(val, range, domain, { ...options, invert: false });
}

/**
 * Map an array of values using linear mapping
 * @param values Array of values to map
 * @param domain The input range [min, max] or a single number
 * @param range The output range [min, max] or a single number
 * @param options Mapping options
 * @returns Array of mapped values
 * @example
 * ```typescript
 * // Map an array of values
 * const values = [0, 25, 50, 75, 100];
 * const mapped = mapArrayLinear(values, [0, 100], [0, 1]); // Returns [0, 0.25, 0.5, 0.75, 1]
 * ```
 */
export function mapArrayLinear(
  values: number[],
  domain: Range | number,
  range: Range | number,
  options: LinearMapOptions = {}
): number[] {
  return values.map((val) => linearMap(val, domain, range, options));
}

/**
 * Create a bi-directional linear mapper that can map forward and reverse
 * @param domain The input range [min, max] or a single number
 * @param range The output range [min, max] or a single number
 * @param options Mapping options
 * @returns Bi-directional mapper with forward and reverse mapping functions
 * @example
 * ```typescript
 * // Create a bi-directional mapper for temperature conversion
 * const tempConverter = createBiDirectionalMapper([32, 212], [0, 100]);
 * const celsius = tempConverter.forward(98.6); // Fahrenheit to Celsius: ~37
 * const fahrenheit = tempConverter.reverse(37); // Celsius to Fahrenheit: ~98.6
 * ```
 */
export function createBiDirectionalMapper(
  domain: Range | number,
  range: Range | number,
  options: LinearMapOptions = {}
): BiDirectionalMapper {
  return {
    forward: (val: number) => linearMap(val, domain, range, options),
    reverse: (val: number) => linearMap(val, range, domain, options),
  };
}

/**
 * Calculate the minimum and maximum values from an array of numbers
 * @param values Array of numbers to calculate range from
 * @returns Range [min, max] of the input values
 * @example
 * ```typescript
 * const values = [1, 5, 3, 9, 2];
 * const range = calculateRange(values); // Returns [1, 9]
 * ```
 */
export function calculateRange(values: number[]): Range {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid input: Expected a non-empty array of numbers');
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  return [min, max];
}

/**
 * Normalize a value to the 0-1 range based on the given domain
 * @param val Value to normalize
 * @param domain Domain range [min, max] or a single number
 * @param clamp Whether to clamp the value to the domain (default: true)
 * @returns Normalized value between 0 and 1
 * @example
 * ```typescript
 * const normalized = normalizeValue(50, [0, 100]); // Returns 0.5
 * ```
 */
export function normalizeValue(val: number, domain: Range | number, clamp: boolean = true): number {
  return linearMap(val, domain, [0, 1], { clamp });
}

/**
 * Denormalize a value from the 0-1 range to the given range
 * @param val Normalized value (between 0 and 1)
 * @param range Output range [min, max] or a single number
 * @param clamp Whether to clamp the value to 0-1 (default: true)
 * @returns Denormalized value in the output range
 * @example
 * ```typescript
 * const denormalized = denormalizeValue(0.5, [0, 100]); // Returns 50
 * ```
 */
export function denormalizeValue(val: number, range: Range | number, clamp: boolean = true): number {
  return linearMap(val, [0, 1], range, { clamp });
}

/**
 * Collection of common easing functions
 * @example
 * ```typescript
 * linearMap(50, [0, 100], [0, 1], { easing: Easing.easeInOutQuad });
 * ```
 */
export const Easing = {
  /** Linear easing */
  linear: (t: number) => t,
  /** Quadratic ease in */
  easeInQuad: (t: number) => t * t,
  /** Quadratic ease out */
  easeOutQuad: (t: number) => t * (2 - t),
  /** Quadratic ease in out */
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  /** Cubic ease in */
  easeInCubic: (t: number) => t * t * t,
  /** Cubic ease out */
  easeOutCubic: (t: number) => --t * t * t + 1,
  /** Cubic ease in out */
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  /** Sine ease in */
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  /** Sine ease out */
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  /** Sine ease in out */
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  /** Circular ease in */
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  /** Circular ease out */
  easeOutCirc: (t: number) => Math.sqrt(1 - --t * t),
  /** Circular ease in out */
  easeInOutCirc: (t: number) =>
    t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2,
};

// Export as default for backward compatibility
export default linearMap;
