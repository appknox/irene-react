import { useState } from 'react';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT, getLocale, setLocale } from '@irene/translations/intl';
import { LOCALES, storeLocale, type Locale } from '@irene/translations/locale';
import { cn } from '@irene/ui/cn';

/** What each locale calls itself, so a reader finds their own language in the list. */
const LOCALE_NAMES: Record<Locale, () => string> = {
  en: () => akMT('languageEnglish'),
  ja: () => akMT('languageJapanese'),
};

/**
 * Chooses the language the signed-out pages render in.
 *
 * The choice is this browser's, and is remembered for the next visit. It holds
 * until an account signs in, whose own language setting then takes over.
 *
 * @param props.className - Overrides the width, which is otherwise fixed so the
 * control does not resize as the languages change length.
 */
export function LanguageSwitcher({ className }: Readonly<{ className?: string }>) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale);

  const chooseLocale = async (locale: Locale) => {
    setCurrentLocale(locale);
    storeLocale(locale);

    await setLocale(locale);
  };

  return (
    <AkSelect value={currentLocale} onValueChange={(value) => chooseLocale(value as Locale)}>
      <AkSelectTrigger
        aria-label={akMT('language')}
        className={cn('w-42', className)}
        data-test-language-switcher
      >
        <AkSelectValue />
      </AkSelectTrigger>

      {/* Below the trigger and aligned to its right edge, rather than over it in the corner. */}
      <AkSelectContent position="popper" side="bottom" align="end">
        {LOCALES.map((option) => (
          <AkSelectItem key={option} value={option}>
            {LOCALE_NAMES[option]()}
          </AkSelectItem>
        ))}
      </AkSelectContent>
    </AkSelect>
  );
}
