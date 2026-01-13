/**
 * Feature ID type for feature toggles
 */
export type FeatureId = `hypercrx-${string}`;

/**
 * Options storage for Hypercrx extension
 */
import { importedFeatures } from '../README.md';

/**
 * Default options for the extension
 */
export const defaults = Object.assign(
  {
    /** Default locale */
    locale: 'en',
  },
  Object.fromEntries(
    importedFeatures.map((name) => [
      `hypercrx-${name}` as FeatureId,
      name === 'oss-gpt' ? false : true, // Set oss-gpt to not be enabled by default
    ])
  )
);

/**
 * Hypercrx options type
 */
export type HypercrxOptions = typeof defaults;

/**
 * Options storage interface
 */
export interface OptionsStorageInterface {
  /**
   * Get all options
   * @returns Promise resolving to all options
   */
  getAll(): Promise<HypercrxOptions>;

  /**
   * Get a single option
   * @param key Option key
   * @returns Promise resolving to the option value
   */
  get<K extends keyof HypercrxOptions>(key: K): Promise<HypercrxOptions[K]>;

  /**
   * Set multiple options
   * @param options Partial options object
   * @returns Promise resolving when options are set
   */
  set(options: Partial<HypercrxOptions>): Promise<void>;

  /**
   * Set a single option
   * @param key Option key
   * @param value Option value
   * @returns Promise resolving when option is set
   */
  set<K extends keyof HypercrxOptions>(key: K, value: HypercrxOptions[K]): Promise<void>;

  /**
   * Reset all options to defaults
   * @returns Promise resolving when options are reset
   */
  reset(): Promise<void>;

  /**
   * Clear all options
   * @returns Promise resolving when options are cleared
   */
  clear(): Promise<void>;

  /**
   * Listen for changes to specific keys
   * @param keys Keys to listen for changes
   * @param callback Callback function to call when changes occur
   * @returns Function to remove the listener
   */
  onChanged<K extends keyof HypercrxOptions>(
    keys: K | K[],
    callback: (changes: Partial<HypercrxOptions>) => void
  ): () => void;
}

/**
 * Options storage implementation
 */
class OptionsStorage implements OptionsStorageInterface {
  // Cache for options to avoid repeated storage reads
  private cache: HypercrxOptions | null = null;

  /**
   * Get all options
   * @returns Promise resolving to all options
   */
  public async getAll(): Promise<HypercrxOptions> {
    try {
      // Return from cache if available
      if (this.cache) {
        return this.cache;
      }

      // Read from storage with defaults
      const options = await chrome.storage.sync.get(defaults);
      const typedOptions = options as HypercrxOptions;

      // Cache the result
      this.cache = typedOptions;

      return typedOptions;
    } catch (error) {
      console.error('Error getting all options:', error);
      // Return defaults if storage read fails
      return defaults;
    }
  }

  /**
   * Get a single option
   * @param key Option key
   * @returns Promise resolving to the option value
   */
  public async get<K extends keyof HypercrxOptions>(key: K): Promise<HypercrxOptions[K]> {
    const options = await this.getAll();
    return options[key];
  }

  /**
   * Set multiple options
   * @param options Partial options object
   * @returns Promise resolving when options are set
   */
  public async set(options: Partial<HypercrxOptions>): Promise<void> {
    try {
      await chrome.storage.sync.set(options);

      // Update cache if it exists
      if (this.cache) {
        this.cache = { ...this.cache, ...options };
      }
    } catch (error) {
      console.error('Error setting options:', error);
      throw error;
    }
  }

  /**
   * Set a single option
   * @param key Option key
   * @param value Option value
   * @returns Promise resolving when option is set
   */
  public async set<K extends keyof HypercrxOptions>(key: K, value: HypercrxOptions[K]): Promise<void> {
    await this.set({ [key]: value } as Partial<HypercrxOptions>);
  }

  /**
   * Reset all options to defaults
   * @returns Promise resolving when options are reset
   */
  public async reset(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
      // Clear cache
      this.cache = null;
    } catch (error) {
      console.error('Error resetting options:', error);
      throw error;
    }
  }

  /**
   * Clear all options
   * @returns Promise resolving when options are cleared
   */
  public async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
      // Clear cache
      this.cache = null;
    } catch (error) {
      console.error('Error clearing options:', error);
      throw error;
    }
  }

  /**
   * Listen for changes to specific keys
   * @param keys Keys to listen for changes
   * @param callback Callback function to call when changes occur
   * @returns Function to remove the listener
   */
  public onChanged<K extends keyof HypercrxOptions>(
    keys: K | K[],
    callback: (changes: Partial<HypercrxOptions>) => void
  ): () => void {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const listener = (changes: chrome.storage.StorageChangeMap) => {
      const relevantChanges: Partial<HypercrxOptions> = {};

      // Filter relevant changes
      for (const key of keysArray) {
        if (key in changes) {
          relevantChanges[key] = changes[key].newValue as any;
        }
      }

      // If there are relevant changes, call the callback
      if (Object.keys(relevantChanges).length > 0) {
        // Update cache if it exists
        if (this.cache) {
          this.cache = { ...this.cache, ...relevantChanges };
        }

        callback(relevantChanges);
      }
    };

    // Add the listener
    chrome.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }
}

/**
 * Options storage instance
 */
const optionsStorage = new OptionsStorage();

export default optionsStorage;
