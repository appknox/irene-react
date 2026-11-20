import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useMatchRoute, useSearch } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerTrigger } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTabs, AkTabsBadge, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import {
  skInventoryAppsOptions,
  skPendingReviewAppsOptions,
} from '@/features/storeknox/queries/inventory';

import { PageWrapper } from '@/components/page-wrapper';
import { readInventoryListParams } from '@/features/storeknox/utils/list-params';
import { useOrganization } from '@/hooks/use-organization';
import type { FileRouteTypes } from '@/routeTree.gen';

import { SettingsDrawer } from './components/settings-drawer';

type InventoryTabRoute = Extract<FileRouteTypes['to'], `/dashboard/storeknox/inventory/${string}`>;

interface InventoryTab {
  label: string;
  to: InventoryTabRoute;
  count: number;
}

/**
 * The frame the inventory's tabs sit in, each with its count. The pending-review count is fetched
 * whatever tab is open, and the inventory count follows the list's filter, both as in irene.
 */
export function InventoryLayout() {
  const { isOwner, isAdmin } = useOrganization();
  const matchRoute = useMatchRoute();

  const search = useSearch({ strict: false });

  /*
    On the app list the count shares the list's query. Other tabs page with the same `app_limit` and
    `app_offset`, so there the count reads the first page rather than refetch the inventory per page.
  */
  const isAppList = Boolean(matchRoute({ to: '/dashboard/storeknox/inventory/app-list' }));
  const inventoryParams = readInventoryListParams(isAppList ? search : {});

  const { data: inventory } = useQuery(skInventoryAppsOptions(inventoryParams));
  const { data: pending } = useQuery(skPendingReviewAppsOptions({ limit: 10, offset: 0 }));

  const tabs = [
    {
      label: akMT('storeknox.appInventory'),
      to: '/dashboard/storeknox/inventory/app-list',
      count: inventory?.count ?? 0,
    },
    isOwner() && {
      label: akMT('storeknox.pendingReview'),
      to: '/dashboard/storeknox/inventory/pending-reviews',
      count: pending?.count ?? 0,
    },
  ].filter((tab): tab is InventoryTab => Boolean(tab));

  const activeTab = tabs.find((tab) => matchRoute({ to: tab.to }))?.to ?? '';

  /* irene puts this button in an otherwise empty band above the table; here it ends the tab bar instead. */
  const offersArchivedApps = isOwner() || isAdmin();

  return (
    <PageWrapper contentWidth="standard" className="flex flex-col" data-test-sk-inventory>
      <div
        className="
          my-2.5 flex items-center justify-between gap-4 border border-border bg-background p-5
        "
      >
        <div className="flex flex-col gap-1">
          <AkTypography tag="h1" variant="subtitle1">
            <AkMessageTranslate id="storeknox.inventoryHeader" />
          </AkTypography>

          <AkTypography variant="body2" color="neutral">
            <AkMessageTranslate id="storeknox.inventoryDescription" />
          </AkTypography>
        </div>

        <div className="flex items-center gap-3">
          <AkButton asChild>
            <Link to="/dashboard/storeknox/discover/result">
              <AkMessageTranslate id="storeknox.discoverHeader" />
            </Link>
          </AkButton>

          {isOwner() && (
            <>
              <AkDivider direction="vertical" color="dark" className="h-8" />

              <AkDrawer>
                <AkDrawerTrigger asChild>
                  <AkIconButton
                    variant="outlined"
                    size="medium"
                    aria-label={akMT('storeknox.inventorySettings')}
                  >
                    <AkIcon name="material-symbols:settings" />
                  </AkIconButton>
                </AkDrawerTrigger>

                <SettingsDrawer />
              </AkDrawer>
            </>
          )}
        </div>
      </div>

      <AkTabs value={activeTab} activationMode="manual" className="gap-0">
        <div
          className="
            flex items-end justify-between border border-b-0 border-border bg-background pt-2 pr-3.5
          "
        >
          {/* The table below draws the line under the tabs, so the list drops its own. */}
          <AkTabsList className="data-[orientation=horizontal]:border-b-0">
            {tabs.map((tab) => (
              <AkTabsTrigger key={tab.to} value={tab.to} asChild>
                <Link to={tab.to}>
                  {tab.label}

                  {tab.count > 0 && <AkTabsBadge>{tab.count}</AkTabsBadge>}
                </Link>
              </AkTabsTrigger>
            ))}
          </AkTabsList>

          {/* Hidden rather than removed on the other tab, so the bar keeps its height and the table does not move. */}
          {offersArchivedApps && (
            <AkButton
              variant="outlined"
              color="neutral"
              className={cn('mb-1.5', !isAppList && 'invisible')}
              aria-hidden={!isAppList || undefined}
              tabIndex={isAppList ? undefined : -1}
              asChild
            >
              <Link to="/dashboard/storeknox/inventory/archived-apps">
                <AkMessageTranslate id="storeknox.archivedApps" />
              </Link>
            </AkButton>
          )}
        </div>
      </AkTabs>

      <Outlet />
    </PageWrapper>
  );
}
