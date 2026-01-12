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
 * Determine whether a feature should run based on the given conditions
 * @param props The conditions to check
 * @returns true if the feature should run, false otherwise
 */
export default async function shouldFeatureRun(props: ShouldRunConditions): Promise<boolean> {
  const { asLongAs = [() => true], include = [() => true], exclude = [() => false] } = props;

  // Run all conditions in parallel for better performance
  const [asLongAsResults, includeResults, excludeResults] = await Promise.all([
    Promise.all(asLongAs.map((condition) => condition())),
    Promise.all(include.map((condition) => condition())),
    Promise.all(exclude.map((condition) => condition())),
  ]);

  // Check all conditions
  const allAsLongAsTrue = asLongAsResults.every(Boolean);
  const anyIncludeTrue = includeResults.some(Boolean);
  const noExcludeTrue = !excludeResults.some(Boolean);

  return allAsLongAsTrue && anyIncludeTrue && noExcludeTrue;
}
