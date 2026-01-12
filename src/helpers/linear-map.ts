/**
 * Linear map function to convert a value from one range to another
 * @param val The value to map
 * @param domain The input range [min, max]
 * @param range The output range [min, max]
 * @returns The mapped value
 */
export default function linearMap(val: number, domain: [number, number], range: [number, number]): number {
  // Validate input types
  if (typeof val !== 'number' || !Array.isArray(domain) || !Array.isArray(range)) {
    throw new TypeError('Invalid input types. Expected number, [number, number], [number, number]');
  }

  // Ensure domain and range are exactly two elements
  if (domain.length !== 2 || range.length !== 2) {
    throw new Error('Domain and range must be exactly two elements long');
  }

  const [d0, d1] = domain;
  const [r0, r1] = range;

  // Validate that domain and range contain numbers
  if (typeof d0 !== 'number' || typeof d1 !== 'number' || typeof r0 !== 'number' || typeof r1 !== 'number') {
    throw new TypeError('Domain and range must contain only numbers');
  }

  const subDomain = d1 - d0;
  const subRange = r1 - r0;

  // Handle division by zero
  if (subDomain === 0) {
    return subRange === 0 ? r0 : (r0 + r1) / 2;
  }

  // Clamp value to domain boundaries
  let clampedVal = val;
  if (subDomain > 0) {
    clampedVal = Math.max(d0, Math.min(d1, val));
  } else {
    clampedVal = Math.min(d0, Math.max(d1, val));
  }

  // Calculate linear mapping
  return ((clampedVal - d0) / subDomain) * subRange + r0;
}
