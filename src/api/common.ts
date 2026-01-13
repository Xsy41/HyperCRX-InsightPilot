import { OSS_XLAB_ENDPOINT, ErrorCode } from '../constant';
import request from '../helpers/request';

/**
 * Get metric data by name from OSS endpoint
 * @param platform Platform name (github/gitee)
 * @param owner Owner name (repo owner or username)
 * @param metricNameMap Map of metric names to their actual file names
 * @param metric Metric name to fetch
 * @returns Metric data if found, null if 404, throws error otherwise
 */
export const getMetricByName = async (
  platform: string,
  owner: string,
  metricNameMap: Map<string, string>,
  metric: string
): Promise<any | null> => {
  // Input validation
  if (!platform || !owner || !metricNameMap || !metric) {
    throw new Error('Invalid parameters for getMetricByName');
  }

  const metricFileName = metricNameMap.get(metric);
  if (!metricFileName) {
    throw new Error(`Metric ${metric} not found in metricNameMap`);
  }

  try {
    return await request(`${OSS_XLAB_ENDPOINT}/${platform}/${owner}/${metricFileName}.json`);
  } catch (error) {
    // Handle 404 errors specially
    if (error instanceof Error) {
      // Check if error message contains 404
      if (error.message.includes('404') || (error as any).status === 404) {
        return null;
      }
    } else if (error === ErrorCode.NOT_FOUND) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};

export interface Label {
  id: string;
  name: string;
  type: string;
}

/**
 * Repository information interface
 */
export interface RepoInfo {
  name: string;
  fullName: string;
  [key: string]: any;
}

/**
 * Common interface for both repo meta and user meta
 * e.g. https://oss.open-digger.cn/github/X-lab2017/open-digger/meta.json (repo meta file)
 * e.g. https://oss.open-digger.cn/github/tyn1998/meta.json (user meta file)
 * @param name repo name or user name
 */
export interface CommonMeta {
  type: 'user' | 'repo';
  updatedAt: number; // time stamp
  labels?: Label[];
}

export interface RepoMeta extends CommonMeta {}

export interface UserMeta extends CommonMeta {
  repos: RepoInfo[];
}

class MetaStore {
  private static instance: MetaStore;
  private responseCache: Map<string, Promise<Response>>;
  private metaCache: Map<string, CommonMeta>;
  private cacheExpiration: Map<string, number>;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  private constructor() {
    this.responseCache = new Map<string, Promise<Response>>();
    this.metaCache = new Map<string, CommonMeta>();
    this.cacheExpiration = new Map<string, number>();
  }

  public static getInstance(): MetaStore {
    if (!MetaStore.instance) {
      MetaStore.instance = new MetaStore();
    }
    return MetaStore.instance;
  }

  /**
   * Fetch the meta file and cache the response
   * @param platform Platform name (github/gitee)
   * @param name repo name or user name
   * @returns Promise<Response> The fetch response
   */
  private fetchMeta(platform: string, name: string): Promise<Response> {
    const url = `${OSS_XLAB_ENDPOINT}/${platform}/${name}/meta.json`;
    // Cache the promise to avoid duplicate requests with error handling
    const promise = fetch(url).catch((error) => {
      // Handle fetch errors gracefully
      console.error(`Failed to fetch meta for ${platform}/${name}:`, error);
      // Return a fake response with 404 status
      return new Response(null, { status: 404 });
    });
    const cacheKey = `${platform}:${name}`;
    this.responseCache.set(cacheKey, promise);
    return promise;
  }

  /**
   * Check if cache has expired for a given key
   * @param cacheKey Cache key
   * @returns boolean True if cache has expired, false otherwise
   */
  private isCacheExpired(cacheKey: string): boolean {
    const expirationTime = this.cacheExpiration.get(cacheKey);
    if (!expirationTime) {
      return true;
    }
    return Date.now() > expirationTime;
  }

  /**
   * Check if the meta file exists
   * @param platform Platform name (github/gitee)
   * @param name repo name or user name
   * @returns true if the meta file exists, false otherwise
   */
  public async has(platform: string, name: string): Promise<boolean> {
    // Input validation
    if (!platform || !name) {
      return false;
    }

    const cacheKey = `${platform}:${name}`;

    // Check meta cache first, but only if not expired
    if (this.metaCache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
      return true;
    }

    // Check response cache or fetch new data
    let responsePromise = this.responseCache.get(cacheKey);
    if (!responsePromise || this.isCacheExpired(cacheKey)) {
      responsePromise = this.fetchMeta(platform, name);
      this.cacheExpiration.set(cacheKey, Date.now() + this.CACHE_DURATION);
    }

    try {
      const response = await responsePromise;
      return response.ok;
    } catch (error) {
      console.error(`Error checking meta existence for ${platform}/${name}:`, error);
      return false;
    }
  }

  /**
   * Get the parsed meta file if it exists
   * @param platform Platform name (github/gitee)
   * @param name repo name or user name
   * @returns the parsed meta file if it exists, undefined otherwise
   */
  public async get(platform: string, name: string): Promise<CommonMeta | undefined> {
    // Input validation
    if (!platform || !name) {
      return undefined;
    }

    const cacheKey = `${platform}:${name}`;

    // Check meta cache first, but only if not expired
    if (this.metaCache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
      return this.metaCache.get(cacheKey);
    }

    // Check if meta exists
    if (await this.has(platform, name)) {
      try {
        const responsePromise = this.responseCache.get(cacheKey);
        if (!responsePromise) {
          return undefined;
        }

        const response = await responsePromise;
        const meta: CommonMeta = await response.clone().json();
        this.metaCache.set(cacheKey, meta);
        this.cacheExpiration.set(cacheKey, Date.now() + this.CACHE_DURATION);
        return meta;
      } catch (error) {
        console.error(`Failed to parse meta for ${platform}/${name}:`, error);
        // Clear cache for invalid meta data
        this.clearCache(cacheKey);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Clear cache for a specific key
   * @param cacheKey Cache key to clear
   */
  public clearCache(cacheKey: string): void {
    this.responseCache.delete(cacheKey);
    this.metaCache.delete(cacheKey);
    this.cacheExpiration.delete(cacheKey);
  }

  /**
   * Clear all cache entries
   */
  public clearAllCache(): void {
    this.responseCache.clear();
    this.metaCache.clear();
    this.cacheExpiration.clear();
  }

  /**
   * Get current cache size
   * @returns Object with cache sizes
   */
  public getCacheStats(): { responseCache: number; metaCache: number } {
    return {
      responseCache: this.responseCache.size,
      metaCache: this.metaCache.size,
    };
  }
}

export const metaStore = MetaStore.getInstance();
