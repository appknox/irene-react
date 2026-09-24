import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { RawIntlProvider } from 'react-intl';

import { getIntl, subscribeToLocale } from '@irene/translations/intl';

/**
 * Makes the active locale's messages available to `useIntl` and `FormattedMessage`, and renders the app again on a locale change.
 *
 * The subtree is keyed by locale so that everything renders again, not only the
 * components that read the context: `akMT` formats against the active locale at
 * call time, and a component that calls it has nothing to subscribe to.
 *
 * @param props.children - The app.
 */
export function TranslationsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const intl = useSyncExternalStore(subscribeToLocale, getIntl);

  return (
    <RawIntlProvider value={intl}>
      <Fragment key={intl.locale}>{children}</Fragment>
    </RawIntlProvider>
  );
}
