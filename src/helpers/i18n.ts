/**
 * i18n configuration for internationalization support
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import messages_en from '../locales/en/translation.json';
import messages_zh_CN from '../locales/zh_CN/translation.json';

// Define supported languages
const supportedLanguages = ['en', 'zh_CN'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

// Language resources configuration
const languageResources = {
  zh_CN: {
    translation: messages_zh_CN,
  },
  en: {
    translation: messages_en,
  },
};

// Language detector options
const detectorOptions = {
  // Order and from where user language should be detected
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],

  // Keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',

  // Cache user language on
  caches: ['localStorage', 'cookie'],
  excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

  // Optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement,
};

// Backend options
const backendOptions = {
  // Path where resources get loaded from
  loadPath: '/locales/{{lng}}/{{ns}}.json',

  // Path to post missing resources
  addPath: '/locales/add/{{lng}}/{{ns}}',

  // Allow cross domain requests
  crossDomain: false,
};

// Initialize i18next
const initializeI18n = async (): Promise<void> => {
  try {
    await i18n
      // Load backend for remote resources
      .use(Backend)
      // Detect user language
      .use(LanguageDetector)
      // Pass the i18n instance to react-i18next
      .use(initReactI18next)
      // Initialize i18next with configuration
      .init({
        // Debug mode for development
        debug: process.env.NODE_ENV === 'development',

        // Fallback language if detected language is not supported
        fallbackLng: 'en',

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
          format: (value, format) => {
            if (value instanceof Date && format === 'date') {
              return new Intl.DateTimeFormat(i18n.language).format(value);
            }
            return value;
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
          useSuspense: true,
          transSupportBasicHtmlNodes: true,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
        },
      });

    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Initialize i18n
initializeI18n();

export default i18n;

/**
 * Get the current language
 * @returns Current language code
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

/**
 * Change the current language
 * @param language Language code to change to
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Check if a language is supported
 * @param language Language code to check
 * @returns True if the language is supported
 */
export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return supportedLanguages.includes(language as SupportedLanguage);
};
