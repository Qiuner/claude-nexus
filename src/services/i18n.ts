/**
 * Initializes i18next/react-i18next and provides storage-backed language switching helpers.
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '@src/types/settings';
import enTranslation from '@locales/en/translation.json';
import zhTranslation from '@locales/zh/translation.json';
import zhTWTranslation from '@locales/zh-TW/translation.json';

export const i18n = i18next;

export const LANGUAGE_STORAGE_KEY = 'claude_nexus_language';
export const LANGUAGE_CHANGE_MESSAGE_TYPE = 'claude_nexus_set_language';

type StoredLanguage = Language | undefined;

/**
 * Parses an unknown value into a supported language value.
 * @param value unknown - The value read from storage or external input.
 * @returns Language | undefined
 */
const parseLanguage = (value: unknown): StoredLanguage => {
  if (value === 'en' || value === 'zh' || value === 'zh-TW') return value;
  return undefined;
};

/**
 * Detects the initial language using the browser preferences.
 * @returns Language
 */
const detectBrowserLanguage = (): Language => {
  const lang = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
  if (lang === 'zh-tw' || lang === 'zh-hant' || lang.startsWith('zh-hant-')) return 'zh-TW';
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
};

/**
 * Reads the last selected language from chrome.storage.local.
 * @returns Promise<Language | undefined>
 */
const readStoredLanguage = async (): Promise<StoredLanguage> => {
  try {
    if (!chrome?.storage?.local) return undefined;
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get([LANGUAGE_STORAGE_KEY], (value) => resolve(value || {}));
    });
    return parseLanguage(result[LANGUAGE_STORAGE_KEY]);
  } catch {
    return undefined;
  }
};

/**
 * Persists the selected language to chrome.storage.local.
 * @param lang Language - The language to store.
 * @returns Promise<void>
 */
const writeStoredLanguage = async (lang: Language) => {
  try {
    if (!chrome?.storage?.local) return;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [LANGUAGE_STORAGE_KEY]: lang }, () => resolve());
    });
  } catch {
    return;
  }
};

let initPromise: Promise<void> | null = null;

/**
 * Initializes i18next/react-i18next once and reuses the same initialization promise.
 * @returns Promise<void>
 *
 * Modification Notes:
 *   - 2026-03-09 [Qiuner] Added storage-backed initial language and browser-language fallback.
 */
export const initI18n = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const storedLanguage = await readStoredLanguage();
    const initialLanguage = storedLanguage ?? detectBrowserLanguage();

    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: enTranslation },
        zh: { translation: zhTranslation },
        'zh-TW': { translation: zhTWTranslation },
      },
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
  })();

  return initPromise;
};

/**
 * Switches the active language at runtime and persists the preference.
 * @param lang Language - The language to activate.
 * @returns Promise<void>
 *
 * Modification Notes:
 *   - 2026-03-09 [Qiuner] Ensures i18n is initialized before changing language.
 */
export const setLanguage = async (lang: Language) => {
  await initI18n();
  await i18n.changeLanguage(lang);
  await writeStoredLanguage(lang);
};
