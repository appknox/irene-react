import apkmodyIcon from '@irene/ui/images/apkmody-icon.png';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import AptoideIcon from '@irene/ui/svgs/apptoide-icon.svg?react';
import PlaystoreLogo from '@irene/ui/svgs/playstore-logo.svg?react';
import type { ApiSkFakeAppStore } from '@irene/api/services/storeknox';

/**
 * The logo of the store a copy was found on. Anything that is not apkmody, the Play Store or
 * aptoide reads as the App Store, as irene's store cell does.
 *
 * @param props.store - The store the copy is listed in; its name labels the logo.
 */
export function FakeAppStoreIcon({ store }: Readonly<{ store: ApiSkFakeAppStore }>) {
  switch (store.identifier) {
    case 'apkmody':
      return <img src={apkmodyIcon} alt={store.name} className="size-5" />;
    case 'playstore':
      return <PlaystoreLogo role="img" aria-label={store.name} className="size-4" />;
    case 'aptoide':
      return <AptoideIcon role="img" aria-label={store.name} className="size-4" />;
    default:
      return <AppstoreLogo role="img" aria-label={store.name} className="size-4" />;
  }
}
