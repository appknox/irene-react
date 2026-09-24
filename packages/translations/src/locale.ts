/** The locales the app ships translations for. */
export const LOCALES = ['en', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

/** The locale used before the signed-in user's preference is known. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Where the browser's own choice is kept, for the pages a signed-in account has not reached yet. */
const LOCALE_STORAGE_KEY = 'irene:locale';

/**
 * Checks whether a value is one of the locales the app ships translations for,
 * e.g. a user's `lang` from the API.
 *
 * @param value - The value to check.
 * @returns Whether it is a supported locale.
 */
export const isSupportedLocale = (value: unknown): value is Locale =>
  LOCALES.includes(value as Locale);

/**
 * The locale this browser last chose.
 *
 * Only the signed-out pages read it: once an account is known, the language it
 * is set to is the one that counts.
 *
 * @returns The stored locale, or null where there is none or storage is closed.
 */
export function getStoredLocale() {
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    return isSupportedLocale(storedLocale) ? storedLocale : null;
  } catch {
    // Private browsing and blocked site data both throw rather than answer.
    return null;
  }
}

/**
 * Remembers the locale to render in until an account says otherwise.
 *
 * @param locale - The locale chosen.
 */
export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storing is a convenience: the choice still applies for this page's life.
  }
}
