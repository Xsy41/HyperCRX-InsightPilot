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

  // Check for other falsy values that might be considered "empty"
  return false;
}

/**
 * Check if a string is empty or contains only whitespace
 * @param value The string to check
 * @returns Boolean indicating if the string is empty or whitespace-only
 * @example
 * ```ts
 * isEmptyString(''); // true
 * isEmptyString('   '); // true
 * isEmptyString('hello'); // false
 * isEmptyString(123); // false (not a string)
 * ```
 */
export function isEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Check if an array is empty or contains only null/undefined values
 * @param value The array to check
 * @param strict If true, only check if the array is empty; if false, also check for all null/undefined values
 * @returns Boolean indicating if the array is empty or contains only null/undefined values
 * @example
 * ```ts
 * isEmptyArray([]); // true
 * isEmptyArray([null, undefined]); // true (with strict: false)
 * isEmptyArray([null, undefined], true); // false
 * isEmptyArray([1, 2, 3]); // false
 * ```
 */
export function isEmptyArray(value: unknown, strict: boolean = false): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length === 0) {
    return true;
  }

  return !strict && value.every(isNil);
}

/**
 * Check if an object is empty or contains only null/undefined values
 * @param value The object to check
 * @param strict If true, only check if the object is empty; if false, also check for all null/undefined values
 * @returns Boolean indicating if the object is empty or contains only null/undefined values
 * @example
 * ```ts
 * isEmptyObject({}); // true
 * isEmptyObject({ a: null, b: undefined }); // true (with strict: false)
 * isEmptyObject({ a: null, b: undefined }, true); // false
 * isEmptyObject({ a: 1, b: 2 }); // false
 * ```
 */
export function isEmptyObject(value: unknown, strict: boolean = false): boolean {
  if (typeof value !== 'object' || isNil(value) || value instanceof Map || value instanceof Set) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return true;
  }

  return !strict && keys.every((key) => isNil((value as Record<string, unknown>)[key]));
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

/**
 * Check if a value is not empty
 * @param value The value to check
 * @returns Boolean indicating if the value is not empty
 * @example
 * ```ts
 * isNotEmpty('hello'); // true
 * isNotEmpty([]); // false
 * isNotEmpty({}); // false
 * ```
 */
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

/**
 * Check if a value is blank (null, undefined, or whitespace-only string)
 * @param value The value to check
 * @returns Boolean indicating if the value is blank
 * @example
 * ```ts
 * isBlank(null); // true
 * isBlank('   '); // true
 * isBlank('hello'); // false
 * ```
 */
export function isBlank(value: unknown): boolean {
  if (isNil(value)) {
    return true;
  }
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Check if a value is not blank
 * @param value The value to check
 * @returns Boolean indicating if the value is not blank
 * @example
 * ```ts
 * isNotBlank('hello'); // true
 * isNotBlank('   '); // false
 * isNotBlank(null); // false
 * ```
 */
export function isNotBlank(value: unknown): boolean {
  return !isBlank(value);
}

/**
 * Check if an object has any non-null/non-undefined values
 * @param obj The object to check
 * @returns Boolean indicating if the object has any non-nil values
 * @example
 * ```ts
 * hasValues({ a: null, b: 'value' }); // true
 * hasValues({ a: null, b: undefined }); // false
 * ```
 */
export function hasValues(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some((value) => !isNil(value));
}

/**
 * Check if an object has any non-empty values
 * @param obj The object to check
 * @returns Boolean indicating if the object has any non-empty values
 * @example
 * ```ts
 * hasNonEmptyValues({ a: '', b: 'value' }); // true
 * hasNonEmptyValues({ a: '', b: [] }); // false
 * ```
 */
export function hasNonEmptyValues(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some((value) => !isEmpty(value));
}

/**
 * Check if a value is null, undefined, or empty
 * @param value The value to check
 * @returns Boolean indicating if the value is null, undefined, or empty
 * @example
 * ```ts
 * isNullOrEmpty(null); // true
 * isNullOrEmpty(''); // true
 * isNullOrEmpty([]); // true
 * isNullOrEmpty('hello'); // false
 * ```
 */
export function isNullOrEmpty(value: unknown): boolean {
  return isNil(value) || isEmpty(value);
}
