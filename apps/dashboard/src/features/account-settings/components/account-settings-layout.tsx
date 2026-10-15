import { Link, Outlet, useMatchRoute, useRouterState } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { AkTabs, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import type { FileRouteTypes } from '@/routeTree.gen';

/* Every page beneath account settings, read from the generated tree. */
type AccountSettingsRoute = Extract<FileRouteTypes['to'], `/dashboard/settings/${string}`>;

/** One tab in the account settings row. */
interface AccountSettingsTab {
  label: string;
  to: AccountSettingsRoute;
}

/**
 * The frame every account settings page sits in: the heading, a tab per page,
 * and the active page in the panel under them.
 *
 * Each tab is a link, so the route decides which tab is active and the tabs
 * activate manually: the arrow keys move between them without navigating.
 */
export function AccountSettingsLayout() {
  const { features } = useOrganization();
  const matchRoute = useMatchRoute();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  /*
    Every role registers its own device, so the CYOD tab follows the
    organization's `cyod` feature, not the owner's registration switch, which
    only blocks new enrolments while the device list stays useful.
  */
  const tabs = [
    { label: akMT('general'), to: '/dashboard/settings/general' },
    { label: akMT('security'), to: '/dashboard/settings/security' },
    { label: akMT('developerSettings'), to: '/dashboard/settings/developersettings' },
    features().cyod && {
      label: akMT('cyod.settings.tabLabel'),
      to: '/dashboard/settings/cyod-settings',
    },
    { label: akMT('notificationPreferences'), to: '/dashboard/settings/notification-settings' },
  ].filter((tab): tab is AccountSettingsTab => Boolean(tab));

  /*
    irene leaves the CYOD route reachable when its tab is hidden, so the panel
    falls back to the URL and still renders a page that has no tab.
  */
  const activeTab = tabs.find((tab) => matchRoute({ to: tab.to }))?.to ?? pathname;

  return (
    <div className="mx-auto w-full max-w-300 px-6 pt-4 pb-6" data-test-account-settings>
      <AkTypography tag="h1" variant="h4" className="mt-1.75 mb-5.25 text-xl">
        {akMT('accountSettings')}
      </AkTypography>

      <AkTabs value={activeTab} activationMode="manual" className="gap-0">
        <div className="border border-b-0 border-border bg-background">
          <AkTabsList>
            {tabs.map((tab) => (
              <AkTabsTrigger key={tab.to} value={tab.to} asChild>
                <Link to={tab.to}>{tab.label}</Link>
              </AkTabsTrigger>
            ))}
          </AkTabsList>
        </div>

        <AkTabsContent value={activeTab} className="border border-t-0 border-border bg-background">
          <Outlet />
        </AkTabsContent>
      </AkTabs>
    </div>
  );
}
