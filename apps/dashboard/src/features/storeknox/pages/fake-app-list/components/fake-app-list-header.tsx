import { Link, useNavigate } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkMenu, AkMenuContent, AkMenuItem, AkMenuTrigger } from '@irene/ui/ak-menu';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { SkPlatformLabel } from '@/features/storeknox/components/sk-platform-label';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { SkStoreLabel } from '@/features/storeknox/components/sk-store-label';
import { isAndroid } from '@/features/storeknox/utils/sk-app';

/**
 * The header above one app's fake-app list. It is the inventory details header in its fake-app
 * form, so it has no monitoring switch, upload banner or licence mark: it shows the date of the
 * last detection and a menu back to the app in the inventory.
 *
 * @param props.app - The inventory app the list is about.
 */
export function FakeAppListHeader({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  const navigate = useNavigate();
  const { app_metadata: metadata } = app;
  const android = isAndroid(app);

  return (
    <div className="w-full pb-6" data-test-sk-fake-app-list-header>
      <AkBreadcrumbs aria-label={akMT('storeknox.fakeAppsTitle')} className="pb-6">
        <AkBreadcrumbsItem asChild>
          <Link to="/dashboard/storeknox/fake-apps">
            <AkMessageTranslate id="storeknox.fakeAppsTitle" />
          </Link>
        </AkBreadcrumbsItem>

        <AkBreadcrumbsItem current>{metadata.package_name}</AkBreadcrumbsItem>
      </AkBreadcrumbs>

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
          <AkTooltip arrow title={akMT('storeknox.lastFakeAppDetectionDate')}>
            <span
              className="inline-flex items-center gap-1 bg-neutral-100 px-1.5 py-0.75"
              tabIndex={0}
            >
              <AkIcon name="material-symbols:event" className="size-4" />

              <AkTypography>
                {formatDateTime(app.last_fake_detection_on, 'mediumDate')}
              </AkTypography>
            </span>
          </AkTooltip>

          <AkMenu>
            <AkMenuTrigger asChild>
              <AkIconButton aria-label={akMT('actions')}>
                <AkIcon name="material-symbols:more-vert" />
              </AkIconButton>
            </AkMenuTrigger>

            <AkMenuContent arrow>
              <AkMenuItem
                onSelect={() =>
                  navigate({
                    to: '/dashboard/storeknox/inventory-details/$id',
                    params: { id: String(app.id) },
                  })
                }
              >
                <AkMessageTranslate id="storeknox.viewInInventory" />
              </AkMenuItem>
            </AkMenuContent>
          </AkMenu>
        </div>
      </div>

      <div className="flex w-full gap-2 border border-t-0 border-border bg-background px-4 py-2">
        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <SkPlatformLabel android={android} />
        </span>

        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <SkStoreLabel android={android} />
        </span>
      </div>
    </div>
  );
}
