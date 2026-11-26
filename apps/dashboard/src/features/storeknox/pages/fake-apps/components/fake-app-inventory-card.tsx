import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import StoreknoxPlaystoreLogo from '@irene/ui/svgs/storeknox-playstore-logo.svg?react';
import type { ApiSkApp } from '@irene/api/services/storeknox';

import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { suspectedShare, suspectedTotal } from '@/features/storeknox/utils/fake-app';
import { isAndroid, isDecommissioned } from '@/features/storeknox/utils/sk-app';

interface FakeAppInventoryCardProps {
  app: ApiSkApp;
}

interface SuspectedRowProps {
  label: string;
  count: number;
  total: number;
  barClassName: string;
}

/* A kind of suspected copy: how many of the app's suspected copies it is, as a count and a bar. */
function SuspectedRow({ label, count, total, barClassName }: Readonly<SuspectedRowProps>) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between">
        <AkTypography>{label}</AkTypography>

        <AkTypography tag="span" fontWeight="bold">
          {count}{' '}
          <AkTypography tag="span" color="textSecondary">
            <AkMessageTranslate id="outOf" />
          </AkTypography>{' '}
          {total}
        </AkTypography>
      </div>

      <AkProgressLinear
        label={label}
        value={suspectedShare(count, total)}
        className={cn('h-3', barClassName)}
      />
    </div>
  );
}

/**
 * One inventory app the fake-app listing reports on, with its suspected copies counted.
 *
 * The package name is a link stretched over the whole card, which opens the app's own fake-app
 * list and keeps the card reachable by keyboard; the store link above it stays clickable.
 *
 * @param props.app - The inventory app, with its fake-app counts.
 */
export function FakeAppInventoryCard({ app }: Readonly<FakeAppInventoryCardProps>) {
  const { app_metadata: metadata, fake_app_counts: counts } = app;
  const total = suspectedTotal(counts);

  return (
    <div
      className="relative flex w-full flex-col bg-background shadow-15"
      data-test-sk-fake-app-card
    >
      <div className="flex w-full items-center justify-between gap-2 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <SkRoundAppIcon
            src={metadata.icon_url}
            alt={metadata.title}
            className="size-14.5 border border-border"
          />

          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 max-w-full"
            >
              <AkTypography
                variant="h5"
                fontWeight="bold"
                underline="always"
                title={metadata.title}
              >
                {metadata.title}
              </AkTypography>
            </a>

            <Link
              to="/dashboard/storeknox/fake-apps/$skApp"
              params={{ skApp: String(app.id) }}
              className="max-w-full after:absolute after:inset-0"
            >
              <AkTypography noWrap title={metadata.package_name}>
                {metadata.package_name}
              </AkTypography>
            </Link>

            <AkTypography color="textSecondary" noWrap title={metadata.dev_name}>
              {akMT('by')} {metadata.dev_name}
            </AkTypography>
          </div>
        </div>

        {/* The decommissioned chip sits above the store logo, so it never changes the card's height. */}
        <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
          {isDecommissioned(app) && (
            <AkChip
              size="small"
              variant="semi-filled"
              color="error"
              label={akMT('storeknox.decommissioned')}
            />
          )}

          <span
            className="
              mt-auto flex size-8 items-center justify-center rounded-full border border-border
            "
          >
            {isAndroid(app) ? (
              <StoreknoxPlaystoreLogo
                role="img"
                aria-label={akMT('storeknox.playStore')}
                className="size-4"
              />
            ) : (
              <AppstoreLogo role="img" aria-label={akMT('storeknox.appStore')} className="size-4" />
            )}
          </span>
        </div>
      </div>

      <hr className="mx-6 border-border" />

      <div className="flex w-full flex-col items-center gap-2 py-6">
        <AkIcon name="fluent:app-recent-24-regular" className="size-8.5 text-primary" />

        <AkTypography variant="h2" fontWeight="bold">
          {total}
        </AkTypography>

        <AkTypography color="textSecondary">
          <AkMessageTranslate id="storeknox.fakeApps.suspectedApps" />
        </AkTypography>
      </div>

      <div className="flex w-full flex-col items-center px-6">
        <hr className="w-full border-border" />

        <div className="mt-6 flex w-full flex-col gap-3">
          <SuspectedRow
            label={akMT('storeknox.brandAbuse')}
            count={counts?.brand_abuse ?? 0}
            total={total}
            barClassName={cn(
              'bg-brand-abuse-surface',
              '[&::-moz-progress-bar]:bg-brand-abuse [&::-webkit-progress-value]:bg-brand-abuse'
            )}
          />

          <SuspectedRow
            label={akMT('storeknox.fakeApps.fakeApp')}
            count={counts?.fake_app ?? 0}
            total={total}
            barClassName={cn(
              'bg-fake-app-surface',
              '[&::-moz-progress-bar]:bg-fake-app [&::-webkit-progress-value]:bg-fake-app'
            )}
          />
        </div>

        <hr className="mt-5 w-full border-border" />

        <div className="flex w-full flex-col items-start pt-5 pb-7">
          <AkTypography color="textSecondary" gutterBottom>
            <AkMessageTranslate id="storeknox.lastMonitoringDate" />
          </AkTypography>

          <AkTypography fontWeight="bold">
            {formatDateTime(app.last_fake_detection_on, 'mediumDate')}
          </AkTypography>
        </div>
      </div>
    </div>
  );
}
