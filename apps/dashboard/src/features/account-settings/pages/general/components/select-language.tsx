import { useIsMutating, useMutation } from '@tanstack/react-query';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { UserService } from '@irene/api/services/user';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT, getLocale, setLocale } from '@irene/translations/intl';
import { isSupportedLocale, LOCALES, storeLocale, type Locale } from '@irene/translations/locale';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { userKeys } from '@/queries/user';

/** What each locale calls itself, so a reader finds their own language in the list. */
const LOCALE_NAMES: Record<Locale, () => string> = {
  en: () => akMT('languageEnglish'),
  ja: () => akMT('languageJapanese'),
};

/**
 * Sets the language the account reads the product in.
 *
 * The choice is the account's, saved on the server, unlike the signed-out
 * pages' switcher, which only this browser remembers. The page switches at
 * once, then reloads when the server has it, as irene does, so every
 * server-translated text (vulnerability descriptions among them) is fetched
 * again in the new language.
 *
 * Switching the locale renders the app again from the translations provider
 * down, so nothing here is held in component state: the value is the active
 * locale, which sign-in set from the account's `lang`, and the pending save is
 * read from the mutation cache, which outlives the remount.
 */
export function SelectLanguage() {
  const isSaving = useIsMutating({ mutationKey: userKeys.language() }) > 0;

  const saveLanguage = useMutation({
    mutationKey: userKeys.language(),
    mutationFn: UserService.setLanguage,
    onSuccess: () => window.location.reload(),
    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('somethingWentWrong'));
    }),
  });

  const chooseLanguage = async (value: string) => {
    if (!isSupportedLocale(value)) {
      return;
    }

    saveLanguage.mutate(value);
    storeLocale(value);

    await setLocale(value);
  };

  return (
    <div className="flex flex-col gap-3.5" data-test-select-language>
      <div className="flex flex-col gap-1.75">
        <AkTypography variant="h5">{akMT('language')}</AkTypography>

        <AkTypography color="textSecondary">{akMT('selectLanguage')}</AkTypography>
      </div>

      <AkSelect value={getLocale()} onValueChange={chooseLanguage} disabled={isSaving}>
        <AkSelectTrigger aria-label={akMT('language')} className="w-62.5">
          <AkSelectValue />
        </AkSelectTrigger>

        <AkSelectContent position="popper" side="bottom" align="start">
          {LOCALES.map((option) => (
            <AkSelectItem key={option} value={option}>
              {LOCALE_NAMES[option]()}
            </AkSelectItem>
          ))}
        </AkSelectContent>
      </AkSelect>
    </div>
  );
}
