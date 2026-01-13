/**
 * Feature condition evaluation utilities
 * @zh-CN 功能条件评估工具
 */

/**
 * Condition function type that can return a boolean or a Promise resolving to a boolean
 * @returns boolean or Promise<boolean> indicating whether the condition is met
 */
export type ConditionFunction = () => boolean | Promise<boolean>;

/**
 * Conditions for determining whether a feature should run
 */
export interface ShouldRunConditions {
  /**
   * Every condition in this array must be true for the feature to run
   * @default [() => true]
   * @example
   * ```ts
   * // Run only if user is authenticated and on GitHub
   * asLongAs: [isAuthenticated, isGitHubPage]
   * ```
   */
  asLongAs?: ConditionFunction[];

  /**
   * At least one condition in this array must be true for the feature to run
   * @default [() => true]
   * @example
   * ```ts
   * // Run on either GitHub or Gitee pages
   * include: [isGitHubPage, isGiteePage]
   * ```
   */
  include?: ConditionFunction[];

  /**
   * No conditions in this array must be true for the feature to run
   * @default [() => false]
   * @example
   * ```ts
   * // Don't run on 404 pages
   * exclude: [is404Page]
   * ```
   */
  exclude?: ConditionFunction[];
}

/**
 * Result of condition evaluation
 */
export interface ConditionEvaluationResult {
  /**
   * Whether the feature should run
   */
  shouldRun: boolean;
  /**
   * Results of the asLongAs conditions
   */
  asLongAsResults: boolean[];
  /**
   * Results of the include conditions
   */
  includeResults: boolean[];
  /**
   * Results of the exclude conditions
   */
  excludeResults: boolean[];
}

/**
 * Safe condition executor that handles errors gracefully
 * @param condition The condition function to execute
 * @returns boolean result, false if condition throws an error
 * @example
 * ```ts
 * const result = await safeExecuteCondition(() => true); // true
 * const result = await safeExecuteCondition(() => Promise.resolve(true)); // true
 * const result = await safeExecuteCondition(() => { throw new Error(); }); // false
 * ```
 */
export async function safeExecuteCondition(condition: ConditionFunction): Promise<boolean> {
  try {
    const result = await Promise.resolve(condition());
    return Boolean(result);
  } catch (error) {
    console.error('Error executing condition:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Create a condition function that negates another condition
 * @param condition The condition to negate
 * @returns A new condition that returns the opposite result
 * @example
 * ```ts
 * const isNotGitHubPage = negateCondition(isGitHubPage);
 * ```
 */
export function negateCondition(condition: ConditionFunction): ConditionFunction {
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }
  return async () => {
    const result = await safeExecuteCondition(condition);
    return !result;
  };
}

/**
 * Create a condition function that checks if all conditions are true
 * @param conditions The conditions to check
 * @returns A new condition that returns true if all conditions are true
 * @example
 * ```ts
 * const isAuthenticatedAndOnGitHub = allConditions([isAuthenticated, isGitHubPage]);
 * ```
 */
export function allConditions(conditions: ConditionFunction[]): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    return results.every(Boolean);
  };
}

/**
 * Create a condition function that checks if any condition is true
 * @param conditions The conditions to check
 * @returns A new condition that returns true if any condition is true
 * @example
 * ```ts
 * const isOnGitHubOrGitee = anyCondition([isGitHubPage, isGiteePage]);
 * ```
 */
export function anyCondition(conditions: ConditionFunction[]): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    return results.some(Boolean);
  };
}

/**
 * Validate should run conditions
 * @param props The conditions to validate
 * @throws TypeError if conditions are invalid
 */
export function validateConditions(props: ShouldRunConditions): void {
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
}

/**
 * Determine whether a feature should run based on the given conditions
 * @param props The conditions to check
 * @param options Optional evaluation options
 * @param options.evaluateAll Whether to evaluate all conditions even if result is already determined
 * @returns true if the feature should run, false otherwise
 * @example
 * ```ts
 * // Basic usage
 * const shouldRun = await shouldFeatureRun({
 *   include: [isGitHubPage],
 *   exclude: [is404Page]
 * });
 *
 * // With asLongAs condition
 * const shouldRun = await shouldFeatureRun({
 *   asLongAs: [isAuthenticated],
 *   include: [isGitHubPage, isGiteePage]
 * });
 * ```
 */
export default async function shouldFeatureRun(
  props: ShouldRunConditions,
  options: { evaluateAll?: boolean } = {}
): Promise<boolean> {
  const result = await evaluateConditions(props, options);
  return result.shouldRun;
}

/**
 * Evaluate conditions and return detailed results
 * @param props The conditions to check
 * @param options Optional evaluation options
 * @param options.evaluateAll Whether to evaluate all conditions even if result is already determined
 * @returns Detailed evaluation results including all condition outcomes
 * @example
 * ```ts
 * const result = await evaluateConditions({
 *   include: [isGitHubPage, isGiteePage],
 *   exclude: [is404Page]
 * });
 *
 * console.log(result.shouldRun); // true or false
 * console.log(result.includeResults); // [true, false] or similar
 * console.log(result.excludeResults); // [false] or similar
 * ```
 */
export async function evaluateConditions(
  props: ShouldRunConditions,
  options: { evaluateAll?: boolean } = {}
): Promise<ConditionEvaluationResult> {
  // Validate input
  validateConditions(props);

  const { asLongAs = [() => true], include = [() => true], exclude = [() => false] } = props;
  const { evaluateAll = false } = options;

  // Evaluate exclude conditions first - if any are true, we can return early
  const excludeResults = await Promise.all(exclude.map(safeExecuteCondition));
  const hasExcludedCondition = excludeResults.some(Boolean);

  if (hasExcludedCondition && !evaluateAll) {
    return {
      shouldRun: false,
      asLongAsResults: [],
      includeResults: [],
      excludeResults,
    };
  }

  // Evaluate asLongAs conditions - if any are false, we can return early
  const asLongAsResults = await Promise.all(asLongAs.map(safeExecuteCondition));
  const allAsLongAsMet = asLongAsResults.every(Boolean);

  if (!allAsLongAsMet && !evaluateAll) {
    return {
      shouldRun: false,
      asLongAsResults,
      includeResults: [],
      excludeResults,
    };
  }

  // Finally evaluate include conditions
  const includeResults = await Promise.all(include.map(safeExecuteCondition));
  const anyIncludeMet = includeResults.some(Boolean);

  return {
    shouldRun: !hasExcludedCondition && allAsLongAsMet && anyIncludeMet,
    asLongAsResults,
    includeResults,
    excludeResults,
  };
}
