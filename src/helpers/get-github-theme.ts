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
}

/**
 * Cache the theme result to avoid repeated DOM queries
 */
let cachedTheme: GithubTheme | null = null;

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

  return {
    colorMode,
    lightTheme,
    darkTheme,
  };
};

/**
 * Determines the effective GitHub theme based on configuration and system preferences
 * @param config GitHub theme configuration
 * @returns Effective GitHub theme (light or dark)
 */
const determineEffectiveTheme = (config: GithubThemeConfig): GithubTheme => {
  const { colorMode, lightTheme, darkTheme } = config;

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
 * Reset the cached theme, useful for testing or when theme changes dynamically
 * @example
 * ```ts
 * // Reset theme cache after manual theme change
 * resetGithubThemeCache();
 * const updatedTheme = getGithubTheme();
 * ```
 */
export function resetGithubThemeCache(): void {
  cachedTheme = null;
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

  const handleThemeChange = () => {
    resetGithubThemeCache();
  };

  mediaQuery.addEventListener('change', handleThemeChange);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange);
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
