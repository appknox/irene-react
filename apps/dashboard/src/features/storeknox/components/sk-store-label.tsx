import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import PlaystoreLogo from '@irene/ui/svgs/playstore-logo.svg?react';

/**
 * The logo and name of the store an inventory app is listed in: Play Store for Android, App Store
 * for iOS. The fake-app list header and the original-app panel both show it.
 *
 * @param props.android - Whether the app is an Android app; otherwise iOS.
 */
export function SkStoreLabel({ android }: Readonly<{ android: boolean }>) {
  return (
    <>
      {android ? (
        <PlaystoreLogo aria-hidden="true" className="w-4" />
      ) : (
        <AppstoreLogo aria-hidden="true" className="w-4" />
      )}

      <AkTypography fontWeight="medium">
        {android ? akMT('storeknox.playStore') : akMT('storeknox.appStore')}
      </AkTypography>
    </>
  );
}
