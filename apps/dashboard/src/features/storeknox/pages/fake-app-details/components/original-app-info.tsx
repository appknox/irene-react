import type { ReactNode } from 'react';

import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { SkPlatformLabel } from '@/features/storeknox/components/sk-platform-label';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { SkStoreLabel } from '@/features/storeknox/components/sk-store-label';
import { isAndroid } from '@/features/storeknox/utils/sk-app';

interface OriginalAppInfoProps {
  app: ApiSkInventoryApp;
  /** Fades the panel once the copy has been ignored. */
  isIgnored: boolean;
}

/** A labelled line of the panel; the label column keeps the values aligned. */
function InfoLine({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <>
      <div className="flex items-center gap-2">
        <AkTypography color="textSecondary" className="min-w-40">
          {label}
        </AkTypography>

        {children}
      </div>

      <AkDivider color="dark" />
    </>
  );
}

/**
 * The app the copy imitates, from the inventory: logo, name, package, platform, store, developer
 * and the date of the last monitoring run. Its icon falls back to a placeholder if it fails to load.
 *
 * @param props.app - The inventory app the fake-app list is about.
 * @param props.isIgnored - Whether the copy has been ignored, which fades the panel.
 */
export function OriginalAppInfo({ app, isIgnored }: Readonly<OriginalAppInfoProps>) {
  const { app_metadata: metadata } = app;
  const android = isAndroid(app);

  return (
    <section
      className={cn(
        'flex h-fit w-full max-w-100 flex-col self-start border border-border bg-background',
        isIgnored && 'opacity-60'
      )}
      aria-label={akMT('storeknox.fakeApps.originalAppDetails')}
      data-test-sk-original-app-info
    >
      <div className="flex items-center gap-2 px-6 py-3">
        <span aria-hidden="true" className="size-4 rounded-xs bg-success" />

        <AkTypography fontWeight="bold">
          {akMT('storeknox.fakeApps.originalAppDetails')}
        </AkTypography>
      </div>

      <AkDivider color="dark" />

      <div className="flex flex-col gap-3 px-6 py-3">
        <InfoLine label={akMT('storeknox.fakeApps.logo')}>
          <SkRoundAppIcon src={metadata.icon_url} alt={metadata.title} className="size-9.5" />
        </InfoLine>

        <InfoLine label={akMT('appName')}>
          <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="underline">
            <AkTypography tag="span" fontWeight="medium">
              {metadata.title}
            </AkTypography>
          </a>
        </InfoLine>

        <InfoLine label={akMT('namespace')}>
          <AkTypography
            fontWeight="medium"
            noWrap
            title={metadata.package_name}
            className="max-w-50"
          >
            {metadata.package_name}
          </AkTypography>
        </InfoLine>

        <InfoLine label={akMT('platform')}>
          <SkPlatformLabel android={android} />
        </InfoLine>

        <InfoLine label={akMT('storeknox.store')}>
          <SkStoreLabel android={android} />
        </InfoLine>

        <InfoLine label={akMT('storeknox.developer')}>
          <AkTypography fontWeight="medium">{metadata.dev_name}</AkTypography>
        </InfoLine>

        <div className="flex items-center gap-2">
          <AkTypography color="textSecondary" className="min-w-40">
            {akMT('storeknox.lastMonitoringDate')}
          </AkTypography>

          <AkTypography fontWeight="medium">
            {formatDateTime(app.last_fake_detection_on, 'mediumDate')}
          </AkTypography>
        </div>
      </div>
    </section>
  );
}
