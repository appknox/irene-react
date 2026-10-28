import { useState } from 'react';

import { ENUMS, ENUMS_DISPLAY } from '@irene/enums';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkDrawer, AkDrawerBody, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { IconName } from '@irene/ui/icons/sets';

import type { ScannedApp } from './apps-by-date';

interface DayDetailDrawerProps {
  day?: string;
  apps: ScannedApp[];
  onClose: () => void;
}

/** What each platform is called, read by the number the server sends it as. */
const PLATFORM_LABELS: Record<number, string> = ENUMS_DISPLAY.PLATFORM;

/** The mark each platform is known by, which is the mark the rest of the product uses. */
const PLATFORM_ICONS: Record<number, IconName> = {
  [ENUMS.PLATFORM.ANDROID]: 'material-symbols:android',
  [ENUMS.PLATFORM.IOS]: 'fa-brands:apple',
};

/** What a platform is called, falling back to the number for one we have no name for. */
const getPlatformLabel = (platform: string): string =>
  PLATFORM_LABELS[Number(platform)] ?? platform;

/** The mark a platform carries, falling back to a plain handset for one we have no mark for. */
const getPlatformIcon = (platform: string): IconName =>
  PLATFORM_ICONS[Number(platform)] ?? 'bx:mobile-alt';

/**
 * Everything scanned on one day, read beside the calendar rather than over it.
 *
 * The calendar's cell carries a single number and its tooltip names the apps;
 * this is where the day is read properly — every app, what it runs on, and how
 * much of it was scanned.
 *
 * @param props.day - The day being read, absent when the drawer is closed.
 * @param props.apps - The apps scanned on it, busiest first.
 * @param props.onClose - Called when the drawer is dismissed.
 */
export function DayDetailDrawer({ day, apps, onClose }: Readonly<DayDetailDrawerProps>) {
  const [headerShouldStick, setHeaderShouldStick] = useState(false);
  const scannedAppsCount = apps.reduce((sum, app) => sum + app.count, 0);

  const androidAppsCount = apps
    .filter((app) => Number(app.platform) === ENUMS.PLATFORM.ANDROID)
    .reduce((sum, app) => sum + app.count, 0);

  return (
    <AkDrawer open={Boolean(day)} onOpenChange={(open) => !open && onClose()}>
      <AkDrawerContent className="w-full max-w-120" data-test-day-detail>
        <AkDrawerHeader title={formatDateTime(day, DateTimeFormat.ll)} closeLabel={akMT('close')} />

        <AkDrawerBody
          className="flex flex-col p-0"
          onScroll={(event) => setHeaderShouldStick(event.currentTarget.scrollTop > 0)}
        >
          <div
            className={cn(
              'sticky top-0 z-10 flex shrink-0 flex-col gap-7 bg-background px-5.25 pt-6 pb-5',
              'transition-shadow duration-200',
              headerShouldStick && 'shadow-19'
            )}
          >
            <div className="flex items-end gap-10">
              <div className="flex flex-col">
                <AkTypography variant="h2" fontWeight="bold" className="leading-none tabular-nums">
                  {scannedAppsCount.toLocaleString()}
                </AkTypography>

                <AkTypography variant="body2" color="textSecondary">
                  {akMT('files')}
                </AkTypography>
              </div>

              <div className="flex flex-col">
                <AkTypography variant="h4" fontWeight="bold" className="leading-none tabular-nums">
                  {apps.length.toLocaleString()}
                </AkTypography>

                <AkTypography variant="body2" color="textSecondary">
                  {akMT('analyticsModule.appsScanned')}
                </AkTypography>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <AkTypography variant="body3" color="textSecondary" className="uppercase">
                {akMT('analyticsModule.platformSplit')}
              </AkTypography>

              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-divider">
                <div
                  className="bg-primary"
                  style={{
                    width: `${scannedAppsCount > 0 ? Math.round((androidAppsCount / scannedAppsCount) * 100) : 0}%`,
                  }}
                />

                <div className="flex-1 bg-info" />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />

                  <AkTypography tag="span" variant="body2" color="textSecondary">
                    {akMT('android')} · {androidAppsCount.toLocaleString()}
                  </AkTypography>
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-info" />

                  <AkTypography tag="span" variant="body2" color="textSecondary">
                    {akMT('ios')} · {(scannedAppsCount - androidAppsCount).toLocaleString()}
                  </AkTypography>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5.25 py-6">
            <AkTypography
              variant="body3"
              color="textSecondary"
              className="uppercase tracking-wider"
            >
              {akMT('analyticsModule.appsScanned')}
            </AkTypography>

            <ul className="flex flex-col divide-y divide-divider">
              {apps.map((app) => (
                <li
                  key={app.packageName}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  data-test-day-detail-app={app.packageName}
                >
                  <AkIcon
                    name={getPlatformIcon(app.platform)}
                    aria-label={getPlatformLabel(app.platform)}
                    className={cn(
                      'size-5 shrink-0',
                      Number(app.platform) === ENUMS.PLATFORM.ANDROID ? 'text-android' : 'text-ios'
                    )}
                  />

                  <AkTypography
                    variant="body2"
                    tag="span"
                    className="min-w-0 flex-1 truncate"
                    title={app.packageName}
                  >
                    {app.packageName}
                  </AkTypography>

                  <AkTypography
                    variant="body1"
                    fontWeight="medium"
                    tag="span"
                    className="shrink-0 tabular-nums"
                  >
                    {app.count.toLocaleString()}
                  </AkTypography>
                </li>
              ))}
            </ul>
          </div>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  );
}
