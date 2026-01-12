export function isNull(object: any): boolean {
  return object === null || typeof object === 'undefined';
}

export function isEmpty(object: any): boolean {
  if (isNull(object)) {
    return true;
  }

  if (typeof object === 'string') {
    return object === '';
  }

  if (Array.isArray(object)) {
    return object.length === 0;
  }

  if (typeof object === 'object') {
    return Object.keys(object).length === 0;
  }

  return false;
}

export function isFalsy(object: any): boolean {
  return isNull(object) || isEmpty(object);
}

export function isAllNull(obj: Object): boolean {
  return Object.values(obj).every((value) => isNull(value));
}

export function isAllEmpty(obj: Object): boolean {
  return Object.values(obj).every((value) => isEmpty(value));
}

export function isAllFalsy(obj: Object): boolean {
  return Object.values(obj).every((value) => isFalsy(value));
}
