import { OSS_XLAB_ENDPOINT, ErrorCode } from '../constant';
import request from '../helpers/request';

export const getMetricByName = async (
  platform: string,
  owner: string,
  metricNameMap: Map<string, string>,
  metric: string
) => {
  try {
    return await request(`${OSS_XLAB_ENDPOINT}/${platform}/${owner}/${metricNameMap.get(metric)}.json`);
  } catch (error) {
    // the catched error being "404" means the metric file is not available so return a null
    if (error === ErrorCode.NOT_FOUND) {
      return null;
    } else {
      // other errors should be throwed
      throw error;
    }
  }
};

export interface Label {
  id: string;
  name: string;
  type: string;
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
  repos: unknown[];
}

class MetaStore {
  private static instance: MetaStore;
  private responseCache: Map<string, Promise<Response>>;
  private metaCache: Map<string, CommonMeta>;
  private constructor() {
    this.responseCache = new Map<string, Promise<Response>>();
    this.metaCache = new Map<string, CommonMeta>();
  }

  public static getInstance(): MetaStore {
    if (!MetaStore.instance) {
      MetaStore.instance = new MetaStore();
    }
    return MetaStore.instance;
  }

  /**
   * Fetch the meta file and cache the response
   * @param name repo name or user name
   */
  private fetchMeta(platform: string, name: string) {
    const url = `${OSS_XLAB_ENDPOINT}/${platform}/${name}/meta.json`;
    // Cache the promise to avoid duplicate requests with error handling
    const promise = fetch(url).catch((error) => {
      // Handle fetch errors gracefully
      console.error(`Failed to fetch meta for ${name}:`, error);
      // Return a fake response with 404 status
      return new Response(null, { status: 404 });
    });
    const cacheKey = `${platform}:${name}`;
    this.responseCache.set(cacheKey, promise);
  }

  /**
   * Check if the meta file exists
   * @param name repo name or user name
   * @returns true if the meta file exists, false otherwise
   */
  public async has(platform: string, name: string) {
    // Check meta cache first
    const cacheKey = `${platform}:${name}`;
    if (this.metaCache.has(cacheKey)) {
      return true;
    }

    if (!this.responseCache.has(cacheKey)) {
      this.fetchMeta(platform, name);
    }
    const response = await this.responseCache.get(cacheKey)!;
    return response.ok;
  }

  /**
   * Get the parsed meta file if it exists
   * @param name repo name or user name
   * @returns the parsed meta file if it exists, undefined otherwise
   */
  public async get(platform: string, name: string): Promise<CommonMeta | undefined> {
    // Check meta cache first
    const cacheKey = `${platform}:${name}`;
    if (this.metaCache.has(cacheKey)) {
      return this.metaCache.get(cacheKey);
    }

    if (await this.has(platform, name)) {
      try {
        const meta: CommonMeta = await this.responseCache
          .get(cacheKey)!
          // clone the response to avoid the response being used up
          // https://stackoverflow.com/a/54115314/10369621
          .then((res) => res.clone().json());
        this.metaCache.set(cacheKey, meta);
        return meta;
      } catch (error) {
        console.error(`Failed to parse meta for ${name}:`, error);
        return undefined;
      }
    }
    return undefined;
  }
}

export const metaStore = MetaStore.getInstance();
