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
  /**
   * Evaluation time in milliseconds
   */
  evaluationTime: number;
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
    // Early return optimization - stop at first false condition
    for (const condition of conditions) {
      const result = await safeExecuteCondition(condition);
      if (!result) {
        return false;
      }
    }
    return true;
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
    // Early return optimization - stop at first true condition
    for (const condition of conditions) {
      const result = await safeExecuteCondition(condition);
      if (result) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Create a condition function that chains multiple conditions together
 * @param conditions The conditions to chain
 * @returns A new condition that returns the first truthy result, or false if all are false
 * @example
 * ```ts
 * // Check for GitHub first, then Gitee, then GitLab
 * const isOnCodeHosting = chainConditions([isGitHubPage, isGiteePage, isGitLabPage]);
 * ```
 */
export function chainConditions(conditions: ConditionFunction[]): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  return async () => {
    for (const condition of conditions) {
      const result = await safeExecuteCondition(condition);
      if (result) {
        return result;
      }
    }
    return false;
  };
}

/**
 * Create a cached version of a condition function
 * @param condition The condition to cache
 * @param ttl Time to live in milliseconds (default: 5000)
 * @returns A new condition that caches its results
 * @example
 * ```ts
 * const cachedIsGitHubPage = cacheCondition(isGitHubPage, 10000);
 * ```
 */
export function cacheCondition(condition: ConditionFunction, ttl: number = 5000): ConditionFunction {
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }

  let cache: {
    result: boolean;
    timestamp: number;
  } | null = null;

  return async () => {
    // Check if cache is valid
    const now = Date.now();
    if (cache && now - cache.timestamp < ttl) {
      return cache.result;
    }

    // Execute condition and cache result
    const result = await safeExecuteCondition(condition);
    cache = {
      result,
      timestamp: now,
    };

    return result;
  };
}

/**
 * Create a condition function that checks if exactly one condition is true
 * @param conditions The conditions to check
 * @returns A new condition that returns true if exactly one condition is true
 * @example
 * ```ts
 * const isExactlyOnePlatform = exactlyOneCondition([isGitHubPage, isGiteePage, isGitlabPage]);
 * ```
 */
export function exactlyOneCondition(conditions: ConditionFunction[]): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    const trueCount = results.filter(Boolean).length;
    return trueCount === 1;
  };
}

/**
 * Create a condition function that checks if a minimum number of conditions are true
 * @param conditions The conditions to check
 * @param minRequired Minimum number of conditions that must be true
 * @returns A new condition that returns true if at least minRequired conditions are true
 * @example
 * ```ts
 * // Require at least 2 of 3 conditions to be true
 * const isAtLeastTwo = minConditions([cond1, cond2, cond3], 2);
 * ```
 */
export function minConditions(conditions: ConditionFunction[], minRequired: number): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  if (typeof minRequired !== 'number' || minRequired < 1 || minRequired > conditions.length) {
    throw new TypeError('minRequired must be a number between 1 and the number of conditions');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    const trueCount = results.filter(Boolean).length;
    return trueCount >= minRequired;
  };
}

/**
 * Create a condition function that checks if at most a maximum number of conditions are true
 * @param conditions The conditions to check
 * @param maxAllowed Maximum number of conditions that can be true
 * @returns A new condition that returns true if no more than maxAllowed conditions are true
 * @example
 * ```ts
 * // Allow at most 1 of 3 conditions to be true
 * const isAtMostOne = maxConditions([cond1, cond2, cond3], 1);
 * ```
 */
export function maxConditions(conditions: ConditionFunction[], maxAllowed: number): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  if (typeof maxAllowed !== 'number' || maxAllowed < 0 || maxAllowed > conditions.length) {
    throw new TypeError('maxAllowed must be a number between 0 and the number of conditions');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    const trueCount = results.filter(Boolean).length;
    return trueCount <= maxAllowed;
  };
}

/**
 * Create a condition function that checks if a specific condition is true after a delay
 * @param condition The condition to check
 * @param delay Delay in milliseconds before checking the condition
 * @returns A new condition that returns true if the condition is true after the delay
 * @example
 * ```ts
 * // Check if element exists after a 500ms delay
 * const isElementLoadedAfterDelay = delayedCondition(() => !!document.querySelector('.element'), 500);
 * ```
 */
export function delayedCondition(condition: ConditionFunction, delay: number): ConditionFunction {
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }
  if (typeof delay !== 'number' || delay < 0) {
    throw new TypeError('Delay must be a non-negative number');
  }
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return safeExecuteCondition(condition);
  };
}

/**
 * Create a condition function that retries the condition until it's true or max attempts are reached
 * @param condition The condition to check
 * @param maxAttempts Maximum number of attempts
 * @param delay Delay between attempts in milliseconds
 * @returns A new condition that returns true if the condition becomes true within max attempts
 * @example
 * ```ts
 * // Retry up to 5 times with 200ms delay between attempts
 * const isElementLoaded = retryCondition(() => !!document.querySelector('.element'), 5, 200);
 * ```
 */
export function retryCondition(condition: ConditionFunction, maxAttempts: number, delay: number): ConditionFunction {
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be a function');
  }
  if (typeof maxAttempts !== 'number' || maxAttempts < 1) {
    throw new TypeError('maxAttempts must be a positive number');
  }
  if (typeof delay !== 'number' || delay < 0) {
    throw new TypeError('Delay must be a non-negative number');
  }
  return async () => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await safeExecuteCondition(condition);
      if (result) {
        return true;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return false;
  };
}

/**
 * Create a condition function that combines multiple conditions with a custom reducer
 * @param conditions The conditions to check
 * @param reducer Function to combine results
 * @returns A new condition that returns the result of the reducer applied to all conditions
 * @example
 * ```ts
 * // Custom logic: at least two conditions must be true and none of them are condition3
 * const customCondition = customCombineConditions(
 *   [cond1, cond2, cond3],
 *   (results) => {
 *     const trueCount = results.filter(Boolean).length;
 *     return trueCount >= 2 && !results[2];
 *   }
 * );
 * ```
 */
export function customCombineConditions(
  conditions: ConditionFunction[],
  reducer: (results: boolean[]) => boolean
): ConditionFunction {
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array');
  }
  if (typeof reducer !== 'function') {
    throw new TypeError('Reducer must be a function');
  }
  return async () => {
    const results = await Promise.all(conditions.map(safeExecuteCondition));
    return reducer(results);
  };
}

/**
 * Create a condition that is always true
 * @returns A condition function that always returns true
 * @example
 * ```ts
 * const alwaysTrue = alwaysCondition();
 * ```
 */
export function alwaysCondition(): ConditionFunction {
  return () => true;
}

/**
 * Create a condition that is always false
 * @returns A condition function that always returns false
 * @example
 * ```ts
 * const alwaysFalse = neverCondition();
 * ```
 */
export function neverCondition(): ConditionFunction {
  return () => false;
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
 * console.log(result.evaluationTime); // Evaluation time in milliseconds
 * ```
 */
export async function evaluateConditions(
  props: ShouldRunConditions,
  options: { evaluateAll?: boolean } = {}
): Promise<ConditionEvaluationResult> {
  // Validate input
  validateConditions(props);

  const startTime = performance.now();

  const { asLongAs = [() => true], include = [() => true], exclude = [() => false] } = props;
  const { evaluateAll = false } = options;

  // Evaluate exclude conditions first - if any are true, we can return early
  const excludeResults = await Promise.all(exclude.map(safeExecuteCondition));
  const hasExcludedCondition = excludeResults.some(Boolean);

  if (hasExcludedCondition && !evaluateAll) {
    const evaluationTime = performance.now() - startTime;
    return {
      shouldRun: false,
      asLongAsResults: [],
      includeResults: [],
      excludeResults,
      evaluationTime,
    };
  }

  // Evaluate asLongAs conditions - if any are false, we can return early
  const asLongAsResults = await Promise.all(asLongAs.map(safeExecuteCondition));
  const allAsLongAsMet = asLongAsResults.every(Boolean);

  if (!allAsLongAsMet && !evaluateAll) {
    const evaluationTime = performance.now() - startTime;
    return {
      shouldRun: false,
      asLongAsResults,
      includeResults: [],
      excludeResults,
      evaluationTime,
    };
  }

  // Finally evaluate include conditions
  const includeResults = await Promise.all(include.map(safeExecuteCondition));
  const anyIncludeMet = includeResults.some(Boolean);

  const evaluationTime = performance.now() - startTime;

  return {
    shouldRun: !hasExcludedCondition && allAsLongAsMet && anyIncludeMet,
    asLongAsResults,
    includeResults,
    excludeResults,
    evaluationTime,
  };
}

/**
 * Combine multiple condition objects into a single ShouldRunConditions object
 * @param conditionObjects Array of ShouldRunConditions objects to combine
 * @returns A combined ShouldRunConditions object
 * @example
 * ```ts
 * const combinedConditions = combineConditionObjects([
 *   { include: [isGitHubPage] },
 *   { asLongAs: [isAuthenticated] },
 *   { exclude: [is404Page] }
 * ]);
 * ```
 */
export function combineConditionObjects(conditionObjects: ShouldRunConditions[]): ShouldRunConditions {
  if (!Array.isArray(conditionObjects)) {
    throw new TypeError('conditionObjects must be an array');
  }

  const combined: ShouldRunConditions = {
    asLongAs: [],
    include: [],
    exclude: [],
  };

  for (const obj of conditionObjects) {
    if (obj.asLongAs) {
      combined.asLongAs!.push(...obj.asLongAs);
    }
    if (obj.include) {
      combined.include!.push(...obj.include);
    }
    if (obj.exclude) {
      combined.exclude!.push(...obj.exclude);
    }
  }

  // Ensure we have default conditions if none were provided
  if (combined.asLongAs!.length === 0) {
    combined.asLongAs = [() => true];
  }
  if (combined.include!.length === 0) {
    combined.include = [() => true];
  }
  if (combined.exclude!.length === 0) {
    combined.exclude = [() => false];
  }

  return combined;
}
