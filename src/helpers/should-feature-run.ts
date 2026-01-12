/**
 * Condition function type that can return a boolean or a Promise resolving to a boolean
 */
export type ConditionFunction = () => boolean | Promise<boolean>;

/**
 * Conditions for determining whether a feature should run
 */
export interface ShouldRunConditions {
  /**
   * Every condition in this array must be true for the feature to run
   */
  asLongAs?: ConditionFunction[];

  /**
   * At least one condition in this array must be true for the feature to run
   */
  include?: ConditionFunction[];

  /**
   * No conditions in this array must be true for the feature to run
   */
  exclude?: ConditionFunction[];
}

/**
 * Safe condition executor that handles errors gracefully
 * @param condition The condition function to execute
 * @returns boolean result, false if condition throws an error
 */
async function safeExecuteCondition(condition: ConditionFunction): Promise<boolean> {
  try {
    const result = await Promise.resolve(condition());
    return Boolean(result);
  } catch (error) {
    console.error('Error executing condition:', error);
    return false;
  }
}

/**
 * Determine whether a feature should run based on the given conditions
 * @param props The conditions to check
 * @returns true if the feature should run, false otherwise
 */
export default async function shouldFeatureRun(props: ShouldRunConditions): Promise<boolean> {
  // Validate input
  if (!props || typeof props !== 'object') {
    throw new TypeError('Props must be an object');
  }

  const { asLongAs = [() => true], include = [() => true], exclude = [() => false] } = props;

  // Validate condition arrays
  if (!Array.isArray(asLongAs) || !Array.isArray(include) || !Array.isArray(exclude)) {
    throw new TypeError('asLongAs, include, and exclude must be arrays');
  }

  // Validate all conditions are functions
  const allConditions = [...asLongAs, ...include, ...exclude];
  for (const condition of allConditions) {
    if (typeof condition !== 'function') {
      throw new TypeError('All conditions must be functions');
    }
  }

  // First check exclude conditions - if any are true, we can immediately return false
  const excludeResults = await Promise.all(exclude.map((condition) => safeExecuteCondition(condition)));
  if (excludeResults.some(Boolean)) {
    return false;
  }

  // Then check asLongAs conditions - if any are false, we can immediately return false
  const asLongAsResults = await Promise.all(asLongAs.map((condition) => safeExecuteCondition(condition)));
  if (!asLongAsResults.every(Boolean)) {
    return false;
  }

  // Finally check include conditions - need at least one true
  const includeResults = await Promise.all(include.map((condition) => safeExecuteCondition(condition)));
  return includeResults.some(Boolean);
}
