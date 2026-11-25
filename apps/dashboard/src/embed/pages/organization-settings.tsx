import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
  type AnyRouter,
} from '@tanstack/react-router';

import { useEffect, useState } from 'react';

import { getStoredSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { OrganizationSettingsWrapper } from '@/features/organization';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { OrganizationAiPoweredFeaturesPage } from '@/features/organization/pages/ai-powered-features';
import { OrganizationIntegrationsPage } from '@/features/organization/pages/integrations';
import { OrganizationServiceAccountPage } from '@/features/organization/pages/service-account';

/*
  The organization's settings, as one component.

  Built the same way as the organization screen beside it: its tabs are links,
  so it carries a router of its own holding only the paths those tabs name, on
  a memory history the host's own routing never sees. The address bar is then
  written to match, which keeps a tab linkable and the URL honest.
*/

const SETTINGS_BASE = '/dashboard/organization/settings';

/* What sits between the pane and the page the host named, as this app's own tabs read. */
const TITLE_SEPARATOR = ' | ';

/** Where the screen opens when the address names no tab of this screen. */
const DEFAULT_TAB = ORGANIZATION_SETTINGS_TABS.integrations;

/** The tab the address names, or the default where it names none of them. */
function openingTab() {
  const { pathname, search } = window.location;

  return pathname.startsWith(SETTINGS_BASE) ? `${pathname}${search}` : DEFAULT_TAB;
}

const rootRoute = createRootRoute({ component: Outlet });

/*
  The signed-in account, under the id the panes ask for it by. It matches no
  path of its own; it is here so the panes find the session where they look.
*/
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => ({ session: getStoredSession() }),
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: SETTINGS_BASE,
  component: OrganizationSettingsWrapper,
});

/*
  The panes this screen owns. The settings pane itself is still Ember's, so the
  tab that names it hands the URL back rather than being listed here.
*/
const tabRoutes = [
  {
    path: 'integrations',
    component: OrganizationIntegrationsPage,
    title: () => akMT('integration'),
  },
  {
    path: 'service-account',
    component: OrganizationServiceAccountPage,
    title: () => akMT('serviceAccount'),
  },
  {
    path: 'ai-powered-features',
    component: OrganizationAiPoweredFeaturesPage,
    title: () => akMT('aiPoweredFeatures'),
  },
].map(({ path, component, title }) =>
  createRoute({
    getParentRoute: () => settingsRoute,
    path,
    component,
    validateSearch: (search: Record<string, unknown>) => search,
    staticData: { pageTitle: title },
  })
);

/* Asked for no tab, the screen opens the first one it owns. */
const indexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: DEFAULT_TAB, replace: true });
  },
});

const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([settingsRoute.addChildren([indexRoute, ...tabRoutes])]),
]);

/** What the open pane is called, for the browser tab. The routes name it as this app's own do. */
const openPaneTitle = (router: AnyRouter) => {
  const match = router.state.matches.at(-1);

  return match?.staticData.pageTitle?.(match) ?? '';
};

/** The organization's settings, tabs and all. */
export function OrganizationSettings() {
  /* Built once per mount, so the screen opens at the address the host is at. */
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [openingTab()] }),
    })
  );

  /*
    The address bar follows the open tab: it replaces rather than pushes, so
    the tabs add no history entries and Back leaves the screen, and it carries
    the existing state object over so the host's own routing keeps its record.
  */
  useEffect(() => {
    const mirrorTabInAddressBar = () => {
      const { pathname, searchStr } = router.state.location;
      const address = `${pathname}${searchStr}`;

      if (address !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(window.history.state, '', address);
      }
    };

    mirrorTabInAddressBar();

    return router.subscribe('onResolved', mirrorTabInAddressBar);
  }, [router]);

  /*
    The browser tab names the open pane, ahead of what the host named the page.

    The host's own routing does not change as the panes do, so its title would
    otherwise stay on whichever pane the screen opened at.
  */
  useEffect(() => {
    const hostTitle = document.title;

    const namePaneInBrowserTab = () => {
      const pane = openPaneTitle(router);

      document.title = pane === '' ? hostTitle : `${pane}${TITLE_SEPARATOR}${hostTitle}`;
    };

    namePaneInBrowserTab();

    const stopFollowing = router.subscribe('onResolved', namePaneInBrowserTab);

    return () => {
      stopFollowing();
      document.title = hostTitle;
    };
  }, [router]);

  return <RouterProvider router={router} />;
}
