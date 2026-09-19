/** The locales the app ships translations for. */
export const LOCALES = ['en', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

/** The locale used before the signed-in user's preference is known. */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Checks whether a value names a supported locale, e.g. a user's `lang` from the API.
 *
 * @param value - The value to check.
 * @returns Whether it is a supported locale.
 */
export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);
