import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTabs, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';

import { PageWrapper } from '@/components/page-wrapper';
import { useOrganization } from '@/hooks/use-organization';
import type { FileRouteTypes } from '@/routeTree.gen';

type DiscoverTabRoute = Extract<FileRouteTypes['to'], `/dashboard/storeknox/discover/${string}`>;

interface DiscoverTab {
  label: string;
  to: DiscoverTabRoute;
}

/**
 * The frame discovery's tabs sit in. Only a member gets the requests tab, since an owner's
 * additions join the inventory at once; irene's welcome modal, which nothing opens, is left out.
 */
export function DiscoverLayout() {
  const { isOwner } = useOrganization();
  const matchRoute = useMatchRoute();

  const tabs = [
    { label: akMT('storeknox.discoveryResults'), to: '/dashboard/storeknox/discover/result' },
    !isOwner() && {
      label: akMT('storeknox.requestedApps'),
      to: '/dashboard/storeknox/discover/requested',
    },
  ].filter((tab): tab is DiscoverTab => Boolean(tab));

  /* Every page here is one of the two tabs; anything not the requests is the search. */
  const activeTab: DiscoverTabRoute = matchRoute({ to: '/dashboard/storeknox/discover/requested' })
    ? '/dashboard/storeknox/discover/requested'
    : '/dashboard/storeknox/discover/result';

  return (
    <PageWrapper contentWidth="standard" className="flex flex-col" data-test-sk-discover>
      <div
        className="
          my-2.5 flex items-center justify-between gap-4 border border-border bg-background p-5
        "
      >
        <div className="flex flex-col gap-1">
          <AkTypography tag="h1" variant="subtitle1">
            <AkMessageTranslate id="storeknox.discoverHeader" />
          </AkTypography>

          <AkTypography variant="body2" color="neutral">
            <AkMessageTranslate id="storeknox.discoverDescription" />
          </AkTypography>
        </div>

        <AkButton asChild>
          <Link to="/dashboard/storeknox/inventory/app-list">
            <AkMessageTranslate id="storeknox.appInventory" />
          </Link>
        </AkButton>
      </div>

      <AkTabs value={activeTab} activationMode="manual" className="mb-5 gap-0">
        <AkTabsList>
          {tabs.map((tab) => (
            <AkTabsTrigger key={tab.to} value={tab.to} asChild>
              <Link to={tab.to}>{tab.label}</Link>
            </AkTabsTrigger>
          ))}
        </AkTabsList>
      </AkTabs>

      <Outlet />
    </PageWrapper>
  );
}
