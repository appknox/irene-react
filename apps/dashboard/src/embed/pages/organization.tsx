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

import { OrganizationLayout } from '@/features/organization';
import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';
import { OrganizationNamespacesPage } from '@/features/organization/pages/namespaces';
import { OrganizationTeamsPage } from '@/features/organization/pages/teams';
import { OrganizationUsersPage } from '@/features/organization/pages/users';

/*
  The organization, as one component.

  Its tabs are links and it asks which one is open, so unlike a screen that
  only reads data it needs a router. That router is built here, for this screen
  alone: the paths are the ones the tabs name, and nothing else is in it. The
  host renders `<Organization />` and gives it nothing.

  The history is in memory, so moving between tabs is this screen's business
  and the host's own routing never sees it. The address bar is then written to
  match, which keeps a tab linkable and the URL honest.
*/

const ORGANIZATION_BASE = '/dashboard/organization';

/* What sits between the pane and the page the host named, as this app's own tabs read. */
const TITLE_SEPARATOR = ' | ';

/** Where the screen opens when the address names no tab of this screen. */
const DEFAULT_TAB = ORGANIZATION_TABS.namespaces;

/** The tab the address names, or the default where it names none of them. */
function openingTab() {
  const { pathname, search } = window.location;

  return pathname.startsWith(ORGANIZATION_BASE) ? `${pathname}${search}` : DEFAULT_TAB;
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

const organizationRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: ORGANIZATION_BASE,
  component: OrganizationLayout,
});

/*
  Each pane keeps its list's state in the search, and a link between panes
  carries it. The search is taken as it comes rather than validated: the panes
  read what they know by name and fall back where the address names nothing,
  and the host's own address may carry parameters of its own.
*/
const tabRoutes = [
  { path: 'namespaces', component: OrganizationNamespacesPage, title: () => akMT('namespaces') },
  { path: 'users', component: OrganizationUsersPage, title: () => akMT('users') },
  { path: 'teams', component: OrganizationTeamsPage, title: () => akMT('teams') },
].map(({ path, component, title }) =>
  createRoute({
    getParentRoute: () => organizationRoute,
    path,
    component,
    validateSearch: (search: Record<string, unknown>) => search,
    staticData: { pageTitle: title },
  })
);

/* The screen has no landing pane; asked for no tab, it opens the first. */
const indexRoute = createRoute({
  getParentRoute: () => organizationRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: DEFAULT_TAB, replace: true });
  },
});

const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([organizationRoute.addChildren([indexRoute, ...tabRoutes])]),
]);

/** What the open pane is called, for the browser tab. The routes name it as this app's own do. */
const openPaneTitle = (router: AnyRouter) => {
  const match = router.state.matches.at(-1);

  return match?.staticData.pageTitle?.(match) ?? '';
};

/** The organization screen, tabs and all. */
export function Organization() {
  /* Built once per mount, so the screen opens at the address the host is at. */
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [openingTab()] }),
    })
  );

  /*
    The address bar follows the open tab and what that tab is showing: the
    search carries each list's state, so a reload or a shared link opens the
    screen as it was left. It replaces rather than pushes, so the tabs add no
    history entries and Back leaves the screen, and it carries the existing
    state object over so the host's own routing keeps its record.
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
    otherwise stay on whichever pane the screen opened at. What it set is kept
    as the rest of the name, so the tab still reads out to the product.
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
