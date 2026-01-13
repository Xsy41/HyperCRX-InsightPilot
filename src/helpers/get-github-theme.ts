/**
 * GitHub theme detection utilities
 * @zh-CN GitHub主题检测工具
 */
import isGithub from './is-github';

/**
 * Possible GitHub theme values
 */
export type GithubTheme = 'light' | 'dark';

/**
 * Possible GitHub color mode values
 */
export type GithubColorMode = 'auto' | 'light' | 'dark';

/**
 * GitHub theme type values
 */
export type GithubThemeType = 'light' | 'dark' | 'dimmed' | 'high_contrast';

/**
 * GitHub theme configuration from DOM attributes
 */
export interface GithubThemeConfig {
  /**
   * Color mode setting (auto, light, or dark)
   */
  colorMode: GithubColorMode;
  /**
   * Light theme identifier
   */
  lightTheme?: string;
  /**
   * Dark theme identifier
   */
  darkTheme?: string;
  /**
   * Current theme name
   */
  currentTheme?: string;
  /**
   * Theme type (light, dark, dimmed, high_contrast)
   */
  themeType?: GithubThemeType;
}

/**
 * Theme change callback type
 */
export type ThemeChangeCallback = (theme: GithubTheme, config: GithubThemeConfig) => void;

/**
 * Theme change listeners
 */
let themeChangeListeners: ThemeChangeCallback[] = [];

/**
 * Cache the theme result to avoid repeated DOM queries
 */
let cachedTheme: GithubTheme | null = null;

/**
 * Cache the theme configuration
 */
let cachedThemeConfig: GithubThemeConfig | null = null;

/**
 * Extracts GitHub theme configuration from DOM attributes
 * @returns GitHub theme configuration object
 * @throws Error if theme attributes cannot be extracted
 */
const extractThemeConfig = (): GithubThemeConfig => {
  const htmlElement = document.documentElement;

  if (!htmlElement) {
    throw new Error('Document element not found');
  }

  const colorMode = (htmlElement.dataset.colorMode as GithubColorMode) || 'auto';
  const lightTheme = htmlElement.dataset.lightTheme;
  const darkTheme = htmlElement.dataset.darkTheme;
  const currentTheme = htmlElement.dataset.theme;

  // Determine theme type from current theme name
  let themeType: GithubThemeType = 'light';
  if (currentTheme?.includes('dark')) {
    themeType = 'dark';
  } else if (currentTheme?.includes('dimmed')) {
    themeType = 'dimmed';
  } else if (currentTheme?.includes('high_contrast')) {
    themeType = 'high_contrast';
  }

  return {
    colorMode,
    lightTheme,
    darkTheme,
    currentTheme,
    themeType,
  };
};

/**
 * Determines the effective GitHub theme based on configuration and system preferences
 * @param config GitHub theme configuration
 * @returns Effective GitHub theme (light or dark)
 */
const determineEffectiveTheme = (config: GithubThemeConfig): GithubTheme => {
  const { colorMode, lightTheme, darkTheme, currentTheme, themeType } = config;

  // If we have a direct theme type, use it
  if (themeType === 'dark' || themeType === 'dimmed' || themeType === 'high_contrast') {
    return 'dark';
  }

  // If current theme is explicitly set, use it
  if (currentTheme) {
    return currentTheme.includes('dark') || currentTheme.includes('dimmed') || currentTheme.includes('high_contrast')
      ? 'dark'
      : 'light';
  }

  // Check if system preference is dark
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (colorMode === 'dark') {
    return 'dark';
  } else if (colorMode === 'light') {
    return 'light';
  } else {
    // Auto mode - determine based on system preference and theme identifiers
    if (isSystemDark) {
      // If system is dark, use dark theme unless explicitly configured otherwise
      return darkTheme?.startsWith('dark') ? 'dark' : 'light';
    } else {
      // If system is light, use light theme unless explicitly configured otherwise
      return lightTheme?.startsWith('dark') ? 'dark' : 'light';
    }
  }
};

/**
 * Get the current GitHub theme
 * @returns 'light' or 'dark' if on GitHub, undefined otherwise
 * @example
 * ```ts
 * // Get current GitHub theme
 * const theme = getGithubTheme();
 * if (theme) {
 *   // Theme is either 'light' or 'dark'
 *   console.log(`Current GitHub theme: ${theme}`);
 * } else {
 *   // Not on GitHub
 *   console.log('Not on GitHub');
 * }
 * ```
 */
export default function getGithubTheme(): GithubTheme | undefined {
  // Return cached theme if available
  if (cachedTheme !== null) {
    return cachedTheme;
  }

  // Only run on GitHub
  if (!isGithub()) {
    return undefined;
  }

  try {
    // Extract theme configuration from DOM
    const config = extractThemeConfig();

    // Cache the configuration
    cachedThemeConfig = config;

    // Determine effective theme
    const effectiveTheme = determineEffectiveTheme(config);

    // Cache the result
    cachedTheme = effectiveTheme;

    return effectiveTheme;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error getting GitHub theme: ${errorMessage}`);
    // Default to light theme on error and cache the result
    cachedTheme = 'light';
    return 'light';
  }
}

/**
 * Get detailed GitHub theme configuration
 * @returns GitHub theme configuration object if on GitHub, undefined otherwise
 * @example
 * ```ts
 * // Get detailed theme configuration
 * const config = getGithubThemeConfig();
 * if (config) {
 *   console.log(`Color mode: ${config.colorMode}`);
 *   console.log(`Current theme: ${config.currentTheme}`);
 * }
 * ```
 */
export function getGithubThemeConfig(): GithubThemeConfig | undefined {
  // Return cached config if available
  if (cachedThemeConfig !== null) {
    return cachedThemeConfig;
  }

  // Only run on GitHub
  if (!isGithub()) {
    return undefined;
  }

  try {
    const config = extractThemeConfig();
    cachedThemeConfig = config;
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error getting GitHub theme config: ${errorMessage}`);
    return {
      colorMode: 'auto',
    };
  }
}

/**
 * Reset the cached theme, useful for testing or when theme changes dynamically
 * @example
 * ```ts
 * // Reset theme cache after manual theme change
 * resetGithubThemeCache();
 * const updatedTheme = getGithubTheme();
 * ```
 */
export function resetGithubThemeCache(): void {
  const oldTheme = cachedTheme;
  const oldConfig = cachedThemeConfig;

  // Clear cache
  cachedTheme = null;
  cachedThemeConfig = null;

  // Get new theme and config
  const newTheme = getGithubTheme();
  const newConfig = getGithubThemeConfig();

  // Notify listeners if theme changed
  if (newTheme && oldTheme !== newTheme && newConfig) {
    notifyThemeChangeListeners(newTheme, newConfig);
  }
}

/**
 * Notify all theme change listeners
 * @param theme New theme
 * @param config New theme configuration
 */
const notifyThemeChangeListeners = (theme: GithubTheme, config: GithubThemeConfig): void => {
  themeChangeListeners.forEach((listener) => {
    try {
      listener(theme, config);
    } catch (error) {
      console.error('Error in theme change listener:', error);
    }
  });
};

/**
 * Add a theme change listener
 * @param callback Function to call when theme changes
 * @returns Function to remove the listener
 * @example
 * ```ts
 * // Add theme change listener
 * const removeListener = addThemeChangeListener((theme, config) => {
 *   console.log(`Theme changed to ${theme}`);
 *   console.log(`New config: ${JSON.stringify(config)}`);
 * });
 *
 * // Later, remove the listener when no longer needed
 * removeListener();
 * ```
 */
export function addThemeChangeListener(callback: ThemeChangeCallback): () => void {
  themeChangeListeners.push(callback);

  // Return cleanup function
  return () => {
    themeChangeListeners = themeChangeListeners.filter((listener) => listener !== callback);
  };
}

/**
 * Listen for theme changes and update the cache automatically
 * @returns Function to remove the event listener
 * @example
 * ```ts
 * // Add theme change listener
 * const removeListener = listenForThemeChanges();
 *
 * // Later, remove the listener when no longer needed
 * removeListener();
 * ```
 */
export function listenForThemeChanges(): () => void {
  // Add event listener for system color scheme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Add MutationObserver to watch for theme attribute changes
  const observer = new MutationObserver(() => {
    resetGithubThemeCache();
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme', 'data-theme'],
    });
  }

  const handleThemeChange = () => {
    resetGithubThemeCache();
  };

  mediaQuery.addEventListener('change', handleThemeChange);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange);
    observer.disconnect();
  };
}

/**
 * Check if the current theme is dark
 * @returns True if theme is dark, false otherwise
 * @example
 * ```ts
 * // Check if current theme is dark
 * if (isDarkTheme()) {
 *   // Render dark theme content
 * }
 * ```
 */
export function isDarkTheme(): boolean {
  const theme = getGithubTheme();
  return theme === 'dark';
}

/**
 * Check if the current theme is light
 * @returns True if theme is light, false otherwise
 * @example
 * ```ts
 * // Check if current theme is light
 * if (isLightTheme()) {
 *   // Render light theme content
 * }
 * ```
 */
export function isLightTheme(): boolean {
  const theme = getGithubTheme();
  return theme === 'light';
}

/**
 * Check if the current theme is dimmed
 * @returns True if theme is dimmed, false otherwise
 * @example
 * ```ts
 * // Check if current theme is dimmed
 * if (isDimmedTheme()) {
 *   // Render content optimized for dimmed theme
 * }
 * ```
 */
export function isDimmedTheme(): boolean {
  const config = getGithubThemeConfig();
  return config?.themeType === 'dimmed';
}

/**
 * Check if the current theme is high contrast
 * @returns True if theme is high contrast, false otherwise
 * @example
 * ```ts
 * // Check if current theme is high contrast
 * if (isHighContrastTheme()) {
 *   // Render content optimized for high contrast
 * }
 * ```
 */
export function isHighContrastTheme(): boolean {
  const config = getGithubThemeConfig();
  return config?.themeType === 'high_contrast';
}

/**
 * Get the current theme type
 * @returns Theme type if on GitHub, undefined otherwise
 * @example
 * ```ts
 * // Get current theme type
 * const themeType = getGithubThemeType();
 * if (themeType) {
 *   console.log(`Current theme type: ${themeType}`);
 * }
 * ```
 */
export function getGithubThemeType(): GithubThemeType | undefined {
  const config = getGithubThemeConfig();
  return config?.themeType;
}

/**
 * Get the current color mode
 * @returns Color mode if on GitHub, undefined otherwise
 * @example
 * ```ts
 * // Get current color mode
 * const colorMode = getGithubColorMode();
 * if (colorMode) {
 *   console.log(`Current color mode: ${colorMode}`);
 * }
 * ```
 */
export function getGithubColorMode(): GithubColorMode | undefined {
  const config = getGithubThemeConfig();
  return config?.colorMode;
}

/**
 * Clear all theme change listeners
 * @example
 * ```ts
 * // Clear all theme change listeners
 * clearThemeChangeListeners();
 * ```
 */
export function clearThemeChangeListeners(): void {
  themeChangeListeners = [];
}
