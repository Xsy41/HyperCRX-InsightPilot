/**
 * Internationalization configuration and utilities
 * @zh-CN 国际化配置和工具
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import messages_en from '../locales/en/translation.json';
import messages_zh_CN from '../locales/zh_CN/translation.json';

/**
 * Supported languages type
 */
export const supportedLanguages = ['en', 'zh_CN'] as const;

/**
 * Supported language code type
 */
export type SupportedLanguage = (typeof supportedLanguages)[number];

/**
 * Language display name mapping
 */
export const languageDisplayNames: Record<SupportedLanguage, string> = {
  en: 'English',
  zh_CN: '中文',
};

/**
 * Language direction mapping (left-to-right or right-to-left)
 */
export const languageDirections: Record<SupportedLanguage, 'ltr' | 'rtl'> = {
  en: 'ltr',
  zh_CN: 'ltr',
};

/**
 * Language resources configuration
 */
export const languageResources = {
  zh_CN: {
    translation: messages_zh_CN,
  },
  en: {
    translation: messages_en,
  },
};

/**
 * i18next initialization options type
 */
export interface I18nInitOptions {
  /** Whether to enable debug mode */
  debug?: boolean;
  /** Fallback language */
  fallbackLng?: string;
  /** Whether to use Suspense in React components */
  useSuspense?: boolean;
}

/**
 * Language detector options
 */
const detectorOptions = {
  // Order and from where user language should be detected
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'] as const,

  // Keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',

  // Cache user language on
  caches: ['localStorage', 'cookie'] as const,
  excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

  // Optional htmlTag with lang attribute
  htmlTag: document.documentElement,
};

/**
 * Backend options
 */
const backendOptions = {
  // Path where resources get loaded from
  loadPath: '/locales/{{lng}}/{{ns}}.json',

  // Path to post missing resources
  addPath: '/locales/add/{{lng}}/{{ns}}',

  // Allow cross domain requests
  crossDomain: false,
};

/**
 * Initialize i18next
 * @param options Optional initialization options
 * @returns Promise that resolves when initialization is complete
 * @example
 * ```ts
 * // Initialize i18n with custom options
 * await initializeI18n({ debug: true });
 * ```
 */
export const initializeI18n = async (options: I18nInitOptions = {}): Promise<void> => {
  const { debug = process.env.NODE_ENV === 'development', fallbackLng = 'en', useSuspense = true } = options;

  try {
    await i18n
      // Load backend for remote resources
      .use(Backend)
      // Detect user language
      .use(LanguageDetector)
      // Pass the i18n instance to react-i18next
      .use(initReactI18nnext)
      // Initialize i18next with configuration
      .init({
        // Debug mode for development
        debug,

        // Fallback language if detected language is not supported
        fallbackLng,

        // Supported languages
        supportedLngs: supportedLanguages,

        // Non supported languages will fallback to this language
        nonExplicitSupportedLngs: true,

        // Clean code
        cleanCode: true,

        // Interpolation options
        interpolation: {
          escapeValue: false, // Not needed for React as it escapes by default
          skipOnVariables: false,
          format: (value: any, format: string): string => {
            if (value instanceof Date) {
              if (format === 'date') {
                return new Intl.DateTimeFormat(i18n.language).format(value);
              }
              if (format === 'time') {
                return new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(value);
              }
              if (format === 'datetime') {
                return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(value);
              }
            }
            return String(value);
          },
        },

        // Language detector configuration
        detection: detectorOptions,

        // Backend configuration
        backend: backendOptions,

        // Language resources
        resources: languageResources,

        // React i18next specific options
        react: {
          useSuspense,
          transSupportBasicHtmlNodes: true,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'] as const,
        },
      });

    if (debug) {
      console.log('i18n initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing i18n:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Initialize i18n automatically when the module is loaded
initializeI18n().catch((error) => {
  console.error('Failed to initialize i18n:', error);
});

/**
 * Get the current language
 * @returns Current language code
 * @example
 * ```ts
 * // Get current language
 * const currentLang = getCurrentLanguage(); // 'en' or 'zh_CN'
 * ```
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

/**
 * Get the display name of a language
 * @param language Language code
 * @returns Display name of the language
 * @example
 * ```ts
 * // Get display name for Chinese
 * const displayName = getLanguageDisplayName('zh_CN'); // '中文'
 * ```
 */
export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  return languageDisplayNames[language];
};

/**
 * Get the writing direction of a language
 * @param language Language code
 * @returns Writing direction ('ltr' or 'rtl')
 * @example
 * ```ts
 * // Get writing direction for English
 * const direction = getLanguageDirection('en'); // 'ltr'
 * ```
 */
export const getLanguageDirection = (language: SupportedLanguage): 'ltr' | 'rtl' => {
  return languageDirections[language];
};

/**
 * Change the current language
 * @param language Language code to change to
 * @returns Promise that resolves when language change is complete
 * @example
 * ```ts
 * // Change to Chinese
 * await changeLanguage('zh_CN');
 * ```
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Check if a language is supported
 * @param language Language code to check
 * @returns True if the language is supported, false otherwise
 * @example
 * ```ts
 * // Check if Spanish is supported
 * const isSupported = isLanguageSupported('es'); // false
 * ```
 */
export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return (supportedLanguages as readonly string[]).includes(language);
};

/**
 * Get all supported languages
 * @returns Array of supported language codes
 * @example
 * ```ts
 * // Get all supported languages
 * const languages = getSupportedLanguages(); // ['en', 'zh_CN']
 * ```
 */
export const getSupportedLanguages = (): SupportedLanguage[] => {
  return [...supportedLanguages];
};

/**
 * Translate a key using i18next
 * @param key Translation key
 * @param options Optional translation options
 * @returns Translated string
 * @example
 * ```ts
 * // Basic translation
 * const translated = t('hello');
 *
 * // Translation with interpolation
 * const translated = t('welcome', { name: 'John' });
 * ```
 */
export const t = i18n.t.bind(i18n);

/**
 * Check if a translation key exists
 * @param key Translation key to check
 * @returns True if the key exists, false otherwise
 * @example
 * ```ts
 * // Check if a key exists
 * const exists = hasTranslation('non_existent_key'); // false
 * ```
 */
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};

/**
 * Format a date using the current language
 * @param date Date to format
 * @param options Date formatting options
 * @returns Formatted date string
 * @example
 * ```ts
 * // Format date with default options
 * const formatted = formatDate(new Date());
 *
 * // Format date with custom options
 * const formatted = formatDate(new Date(), { dateStyle: 'full' });
 * ```
 */
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  const currentLang = getCurrentLanguage();
  return new Intl.DateTimeFormat(currentLang, options).format(date);
};

/**
 * Format a number using the current language
 * @param number Number to format
 * @param options Number formatting options
 * @returns Formatted number string
 * @example
 * ```ts
 * // Format number with default options
 * const formatted = formatNumber(1234.56);
 *
 * // Format number as currency
 * const formatted = formatNumber(1234.56, { style: 'currency', currency: 'USD' });
 * ```
 */
export const formatNumber = (number: number, options: Intl.NumberFormatOptions = {}): string => {
  const currentLang = getCurrentLanguage();
  return new Intl.NumberFormat(currentLang, options).format(number);
};

export default i18n;
