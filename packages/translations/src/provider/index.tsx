import { useSyncExternalStore, type ReactNode } from 'react';
import { RawIntlProvider } from 'react-intl';

import { getIntl, subscribeToLocale } from '@irene/translations/intl';

/**
 * Makes the active locale's messages available to `useIntl` and `FormattedMessage`, and re-renders on a locale change.
 *
 * @param props.children - The app.
 */
export function TranslationsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const intl = useSyncExternalStore(subscribeToLocale, getIntl);

  return <RawIntlProvider value={intl}>{children}</RawIntlProvider>;
}
