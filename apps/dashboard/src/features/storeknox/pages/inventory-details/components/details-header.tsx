import { useState } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import PlaystoreLogo from '@irene/ui/svgs/playstore-logo.svg?react';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { DetailsSectionHeader } from '@/features/storeknox/components/details-section';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { useActiveDetailsSection } from '@/features/storeknox/hooks/use-active-details-section';
import { useMonitoringToggle } from '@/features/storeknox/hooks/use-monitoring-toggle';
import { hasLicense, isAndroid, isDecommissioned } from '@/features/storeknox/utils/sk-app';

import { ArchiveDrawer } from './archive-drawer';
import { DetailsBreadcrumbs } from './details-breadcrumbs';
import { HeaderActions } from './header-actions';
import { ToggleMonitoringDrawer } from './toggle-monitoring-drawer';

/** The header of an app's details, with its breadcrumbs, identity, licence mark, controls and store. */
export function DetailsHeader({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const section = useActiveDetailsSection(app);
  const monitoring = useMonitoringToggle(app);
  const { app_metadata: metadata } = app;
  const android = isAndroid(app);

  const showNotOnAppknox = app.core_project === null && !isDecommissioned(app);

  return (
    <div className="w-full pb-6" data-test-sk-details-header>
      <DetailsBreadcrumbs app={app} current={section?.label} />

      {showNotOnAppknox && (
        <DetailsSectionHeader
          className="min-h-11 border-b-0"
          icon={<AkIcon name="material-symbols:info" className="size-4" />}
        >
          <AkTypography fontWeight="medium">
            <AkMessageTranslate id="storeknox.appNotPartOfAppknox" />
          </AkTypography>
        </DetailsSectionHeader>
      )}

      <div className="flex w-full justify-between gap-2 border border-border bg-background p-6">
        <div className="flex min-w-0 items-center gap-4">
          <SkRoundAppIcon src={metadata.icon_url} alt={metadata.title} className="size-12.5" />

          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 max-w-162.5 underline"
            >
              <AkTypography variant="h5" fontWeight="medium" noWrap title={metadata.title}>
                {metadata.title}
              </AkTypography>
            </a>

            <div className="flex items-center gap-2">
              <AkTypography color="textPrimary">{metadata.package_name}</AkTypography>

              <AkTypography color="textSecondary" fontWeight="bold" aria-hidden="true">
                •
              </AkTypography>

              <AkTypography color="textSecondary">{metadata.dev_name}</AkTypography>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 self-end">
          {hasLicense(app) && (
            <>
              <AkTooltip arrow title={akMT('storeknox.licenseAllocated')}>
                <span
                  className="inline-flex"
                  aria-label={akMT('storeknox.licenseAllocated')}
                  tabIndex={0}
                >
                  <AkIcon
                    name="material-symbols:license-outline-rounded"
                    className="size-7 text-success"
                  />
                </span>
              </AkTooltip>

              <AkDivider direction="vertical" color="dark" className="mx-2 h-8" />
            </>
          )}

          <HeaderActions
            app={app}
            monitoringChecked={monitoring.checked}
            isToggling={monitoring.isToggling}
            onMonitoringToggle={monitoring.onToggle}
            onArchiveClick={() => setArchiveOpen(true)}
          />
        </div>
      </div>

      <div className="flex w-full gap-2 border border-t-0 border-border bg-background px-4 py-2">
        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <AkIcon
            name={android ? 'material-symbols:android' : 'fa-brands:apple'}
            className={cn('size-4', android ? 'text-android' : 'text-ios')}
            data-test-sk-details-platform={android ? 'android' : 'ios'}
          />

          <AkTypography fontWeight="medium">{android ? akMT('android') : akMT('ios')}</AkTypography>
        </span>

        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          {android ? (
            <PlaystoreLogo aria-hidden="true" className="w-4" />
          ) : (
            <AppstoreLogo aria-hidden="true" className="w-4" />
          )}

          <AkTypography fontWeight="medium">
            {android ? akMT('storeknox.playStore') : akMT('storeknox.appStore')}
          </AkTypography>
        </span>
      </div>

      <ArchiveDrawer app={app} open={archiveOpen} onOpenChange={setArchiveOpen} />

      {monitoring.drawerMounted && (
        <ToggleMonitoringDrawer
          organizationId={monitoring.organizationId}
          onConfirm={monitoring.confirm}
          onCancel={monitoring.cancel}
          onClosed={monitoring.unmountDrawer}
        />
      )}
    </div>
  );
}
