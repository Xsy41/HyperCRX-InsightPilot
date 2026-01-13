/**
 * Null and empty value utilities
 * @zh-CN 空值和空对象工具
 */

/**
 * Check if a value is null or undefined
 * @param value The value to check
 * @returns Boolean indicating if the value is null or undefined
 * @example
 * ```ts
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(0); // false
 * isNil(''); // false
 * ```
 */
export function isNil(value: unknown): boolean {
  return value === null || typeof value === 'undefined';
}

/**
 * Check if a value is null (alias for isNil for backward compatibility)
 * @deprecated Use isNil instead for better clarity
 */
export function isNull(value: unknown): boolean {
  return isNil(value);
}

/**
 * Check if a value is empty
 * @param value The value to check
 * @returns Boolean indicating if the value is empty
 * @example
 * ```ts
 * isEmpty(''); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty(0); // false
 * isEmpty('hello'); // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    // Check for Map and Set types
    if (value instanceof Map || value instanceof Set) {
      return value.size === 0;
    }
    // Check for plain objects
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Check if a value is truthy (not null, undefined, empty string, empty array, or empty object)
 * @param value The value to check
 * @returns Boolean indicating if the value is truthy
 * @example
 * ```ts
 * isTruthy('hello'); // true
 * isTruthy([1, 2, 3]); // true
 * isTruthy({ key: 'value' }); // true
 * isTruthy(''); // false
 * isTruthy(null); // false
 * ```
 */
export function isTruthy(value: unknown): boolean {
  return !isNil(value) && !isEmpty(value);
}

/**
 * Check if a value is falsy (null, undefined, empty string, empty array, or empty object)
 * @param value The value to check
 * @returns Boolean indicating if the value is falsy
 * @example
 * ```ts
 * isFalsy(''); // true
 * isFalsy([]); // true
 * isFalsy(null); // true
 * isFalsy('hello'); // false
 * isFalsy([1, 2, 3]); // false
 * ```
 */
export function isFalsy(value: unknown): boolean {
  return isNil(value) || isEmpty(value);
}

/**
 * Check if all values in an object are null or undefined
 * @param obj The object to check
 * @returns Boolean indicating if all values are null or undefined
 * @example
 * ```ts
 * isAllNil({ a: null, b: undefined }); // true
 * isAllNil({ a: null, b: 'value' }); // false
 * ```
 */
export function isAllNil(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(isNil);
}

/**
 * Check if all values in an object are null or undefined (alias for isAllNil)
 * @deprecated Use isAllNil instead for better clarity
 */
export function isAllNull(obj: Record<string, unknown>): boolean {
  return isAllNil(obj);
}

/**
 * Check if all values in an object are empty
 * @param obj The object to check
 * @returns Boolean indicating if all values are empty
 * @example
 * ```ts
 * isAllEmpty({ a: '', b: [] }); // true
 * isAllEmpty({ a: '', b: 'value' }); // false
 * ```
 */
export function isAllEmpty(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(isEmpty);
}

/**
 * Check if all values in an object are falsy
 * @param obj The object to check
 * @returns Boolean indicating if all values are falsy
 * @example
 * ```ts
 * isAllFalsy({ a: '', b: null }); // true
 * isAllFalsy({ a: '', b: 'value' }); // false
 * ```
 */
export function isAllFalsy(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(isFalsy);
}
