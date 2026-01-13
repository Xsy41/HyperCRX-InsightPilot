/**
 * @zh-CN 检查值是否为null或undefined
 * @en-US Check if value is null or undefined
 */
export function isNull<T>(value: T | null | undefined): value is null | undefined {
  return value === null || typeof value === 'undefined';
}

/**
 * @zh-CN 检查值是否为空
 * @en-US Check if value is empty
 */
export function isEmpty<T>(value: T | null | undefined): boolean {
  if (isNull(value)) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * @zh-CN 检查值是否为falsy
 * @en-US Check if value is falsy
 */
export function isFalsy<T>(value: T | null | undefined): boolean {
  return isNull(value) || isEmpty(value);
}

/**
 * @zh-CN 检查对象所有值是否为null或undefined
 * @en-US Check if all values in object are null or undefined
 */
export function isAllNull<T extends Record<string, any>>(obj: T): boolean {
  return Object.values(obj).every(isNull);
}

/**
 * @zh-CN 检查对象所有值是否为空
 * @en-US Check if all values in object are empty
 */
export function isAllEmpty<T extends Record<string, any>>(obj: T): boolean {
  return Object.values(obj).every(isEmpty);
}

/**
 * @zh-CN 检查对象所有值是否为falsy
 * @en-US Check if all values in object are falsy
 */
export function isAllFalsy<T extends Record<string, any>>(obj: T): boolean {
  return Object.values(obj).every(isFalsy);
}

/**
 * @zh-CN 检查值是否为字符串
 * @en-US Check if value is a string
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * @zh-CN 检查值是否为数字
 * @en-US Check if value is a number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * @zh-CN 检查值是否为布尔值
 * @en-US Check if value is a boolean
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * @zh-CN 检查值是否为数组
 * @en-US Check if value is an array
 */
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

/**
 * @zh-CN 检查值是否为对象
 * @en-US Check if value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @zh-CN 检查值是否为函数
 * @en-US Check if value is a function
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * @zh-CN 检查值是否为Promise
 * @en-US Check if value is a Promise
 */
export function isPromise<T>(value: any): value is Promise<T> {
  return value instanceof Promise || (typeof value === 'object' && value !== null && typeof value.then === 'function');
}

/**
 * @zh-CN 检查值是否为Date对象
 * @en-US Check if value is a Date object
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
