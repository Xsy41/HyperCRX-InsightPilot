/**
 * Feature manager for handling feature registration, initialization, and restoration
 */
import domLoaded from 'dom-loaded';
import stripIndent from 'strip-indent';
import { Promisable } from 'type-fest';
import * as pageDetect from 'github-url-detection';

import exists from './helpers/exists';
import waitFor from './helpers/wait-for';
import sleep from './helpers/sleep';
import isRestorationVisit from './helpers/is-restoration-visit';
import shouldFeatureRun, { ShouldRunConditions } from './helpers/should-feature-run';
import optionsStorage from './options-storage';
import { throttle } from 'lodash-es';

/** Feature ID type */
export type FeatureId = `hypercrx-${string}`;

/** Function type for feature initialization */
export type FeatureInit = () => Promisable<void>;

/** Function type for feature restoration after turbo:visit */
export type FeatureRestore = () => Promisable<void>;

/** Configuration for feature loader */
export type FeatureLoader = {
  /**
   * Whether to wait for all DOMs to be ready before running `init`. Setting `false` makes `init` run
   * immediately when `body` is found.
   *
   * @default true
   */
  awaitDomReady?: boolean;
  /** Initialization function for the feature */
  init: FeatureInit;
  /**
   * Will be called after a restoration turbo:visit, if provided.
   *
   * Clicking forward/back button in browser triggers a restoration turbo:visit, which will restore
   * a page directly from cache. Some of the features injected by Hypercrx, however, cannot be fully
   * restored. Hence extra code(i.e. `restore`) is needed to keep features always behaving right.
   */
  restore?: FeatureRestore;
} & Partial<InternalRunConfig>;

/** Internal configuration for running a feature */
export type InternalRunConfig = ShouldRunConditions & {
  /** Initialization function for the feature */
  init: FeatureInit;
};

/** Logging utilities */
const log = {
  info: console.log,
  http: console.log,
  error: (id: string, error: unknown): void => {
    const { version } = chrome.runtime.getManifest();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // Don't change this to `throw Error` because Firefox doesn't show extensions' errors in the console
    console.group(`❌ ${id}`); // Safari supports only one parameter
    console.log(`📕 ${version} →`, error); // One parameter improves Safari formatting
    if (stack) {
      console.log('Stack trace:', stack);
    }
    console.groupEnd();
  },
};

/**
 * Promise that resolves when the global environment is ready
 * - Waits for document body to be available
 * - Skips 500 and password confirmation pages
 * - Checks for duplicate Hypercrx instances
 * - Adds hypercrx class to html element
 * - Loads options from storage
 */
const globalReady = new Promise<Record<string, any>>(async (resolve) => {
  try {
    await waitFor(() => document.body);

    if (pageDetect.is500() || pageDetect.isPasswordConfirmation()) {
      return;
    }

    if (exists('html.hypercrx')) {
      console.warn(
        stripIndent(`
        Hypercrx has been loaded twice. This may be because:

        • You also loaded the developer version

        If you see this at every load, please open an issue in our repository.`)
      );
      return;
    }

    document.documentElement.classList.add('hypercrx');

    const options = await optionsStorage.getAll();
    resolve(options);
  } catch (error) {
    log.error('global-ready', error);
  }
});

/**
 * Setup and run a feature on page load
 * @param id Feature ID
 * @param config Configuration for running the feature
 */
const setupPageLoad = async (id: FeatureId, config: InternalRunConfig): Promise<void> => {
  const { asLongAs, include, exclude, init } = config;

  try {
    if (!(await shouldFeatureRun({ asLongAs, include, exclude }))) {
      return;
    }

    await init();
    log.info('✅', id);
  } catch (error) {
    log.error(id, error);
  }
};

/**
 * Extract feature ID from URL path
 * @param url URL path to extract feature ID from
 * @returns Feature ID in format hypercrx-{name}
 */
export const getFeatureID = (url: string): FeatureId => {
  const prefix = 'hypercrx-';
  const pathComponents = url.split('/');
  let name = pathComponents.pop()?.split('.')[0];

  // Handle cases where URL might be empty or malformed
  if (!name) {
    throw new Error(`Invalid URL for feature ID extraction: ${url}`);
  }

  // If filename is index or gitee-index, use parent directory as feature name
  if (name === 'index' || name === 'gitee-index') {
    name = pathComponents.pop()!;
    if (!name) {
      throw new Error(`Invalid URL structure for feature ID extraction: ${url}`);
    }
  }

  return `${prefix}${name}` as FeatureId;
};

/**
 * Handle turbo:render event for feature restoration and reinitialization
 * @param id Feature ID
 * @param details Feature configuration details
 * @param restore Optional restoration function
 */
const handleTurboRender = throttle(async (id: FeatureId, details: InternalRunConfig, restore?: FeatureRestore) => {
  try {
    if (isRestorationVisit()) {
      /** After experiments I believe turbo:render is fired after the render starts but not
       * after a render ends. So we need to wait for a while to make sure the DOM tree is
       * substituted with the cached one, otherwise all operations on DOM in restore() are
       * applied to the old DOM tree (before turbo:visit). turbo:load is also examined, but
       * it's fired after turbo:visit, not after a render ends. So it cannot be used as the
       * timing neither.
       */
      await sleep(10); // 10ms seems enough
    }

    // If feature doesn't exist in DOM, try loading it
    if (!exists(`#${id}`)) {
      await setupPageLoad(id, details);
    } else if (restore && isRestorationVisit()) {
      // If feature exists and it's a restoration visit, call restore function
      await restore();
      log.info('🔄', id, 'restored');
    }
  } catch (error) {
    log.error(id, error);
  }
}, 200);

/**
 * Register a new feature
 * @param id Feature ID
 * @param loaders Feature loaders (support multiple loaders for one feature)
 */
export const addFeature = async (id: FeatureId, ...loaders: FeatureLoader[]): Promise<void> => {
  try {
    /* Feature filtering and running */
    const options = await globalReady;

    // If the feature is disabled, skip it
    if (!options[id as keyof typeof options]) {
      log.info('↩️', 'Skipping', id);
      return;
    }

    for (const loader of loaders) {
      // Input defaults and validation
      const { asLongAs, include, exclude, init, restore, awaitDomReady = true } = loader;

      if (include?.length === 0) {
        throw new Error(`${id}: \`include\` cannot be an empty array, it means "run nowhere"`);
      }

      // Validate init function exists
      if (typeof init !== 'function') {
        throw new TypeError(`${id}: \`init\` must be a function`);
      }

      // 404 pages should only run 404-only features
      if (pageDetect.is404() && !include?.includes(pageDetect.is404) && !asLongAs?.includes(pageDetect.is404)) {
        continue;
      }

      const details = {
        asLongAs,
        include,
        exclude,
        init,
      };

      // Run feature initialization based on awaitDomReady option
      if (awaitDomReady) {
        (async () => {
          await domLoaded;
          await setupPageLoad(id, details);
        })();
      } else {
        setupPageLoad(id, details);
      }

      // Add turbo:render event listener for feature restoration and reinitialization
      document.addEventListener('turbo:render', () => handleTurboRender(id, details, restore));
    }
  } catch (error) {
    log.error(id, error);
  }
};

/** Features manager object */
const features = {
  add: addFeature,
  log,
  getFeatureID,
};

export default features;
