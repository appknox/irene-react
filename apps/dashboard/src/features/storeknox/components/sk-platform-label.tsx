import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

/**
 * The platform's icon, coloured for the platform, and its name. The fake-app list header, the
 * original-app panel and the copy's details header all name the platform this way.
 *
 * @param props.android - Whether the platform is Android; otherwise iOS.
 */
export function SkPlatformLabel({ android }: Readonly<{ android: boolean }>) {
  return (
    <>
      <AkIcon
        name={android ? 'material-symbols:android' : 'fa-brands:apple'}
        className={cn('size-4', android ? 'text-android' : 'text-ios')}
      />

      <AkTypography fontWeight="medium">{android ? akMT('android') : akMT('ios')}</AkTypography>
    </>
  );
}
