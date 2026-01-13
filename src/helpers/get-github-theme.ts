/**
 * Get the current GitHub theme
 * @returns 'light' or 'dark' if on GitHub, undefined otherwise
 */
import isGithub from './is-github';

/** Possible GitHub theme values */
export type GithubTheme = 'light' | 'dark';

/** Possible GitHub color mode values */
type ColorMode = 'auto' | 'light' | 'dark';

// Cache the theme result to avoid repeated DOM queries
let cachedTheme: GithubTheme | null = null;

/**
 * Get the current GitHub theme
 * @returns 'light' or 'dark' if on GitHub, undefined otherwise
 */
export default function getGithubTheme(): GithubTheme | undefined {
  // Return cached theme if available
  if (cachedTheme) {
    return cachedTheme;
  }

  // Only run on GitHub
  if (!isGithub()) {
    return undefined;
  }

  try {
    // Use native DOM methods instead of jQuery for better performance
    const htmlElement = document.documentElement;

    // Extract theme information from data attributes
    const colorMode = htmlElement.dataset.colorMode as ColorMode;
    const lightTheme = htmlElement.dataset.lightTheme;
    const darkTheme = htmlElement.dataset.darkTheme;

    let theme: GithubTheme = 'light';

    if (
      colorMode === 'dark' ||
      (colorMode === 'auto' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches &&
        darkTheme?.startsWith('dark')) ||
      (colorMode === 'auto' &&
        !window.matchMedia('(prefers-color-scheme: dark)').matches &&
        lightTheme?.startsWith('dark'))
    ) {
      theme = 'dark';
    }

    // Cache the result
    cachedTheme = theme;

    return theme;
  } catch (error) {
    console.error('Error getting GitHub theme:', error);
    return 'light'; // Default to light theme on error
  }
}

/**
 * Reset the cached theme, useful for testing or when theme changes
 */
export function resetGithubThemeCache(): void {
  cachedTheme = null;
}

/**
 * Listen for theme changes and update the cache
 * @returns Function to remove the listener
 */
export function listenForThemeChanges(): () => void {
  // Add event listener for color scheme changes
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
