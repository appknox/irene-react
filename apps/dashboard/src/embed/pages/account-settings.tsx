import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';

import { useEffect, useState } from 'react';

import { getStoredSession } from '@irene/api/utils/session';

import { AccountSettingsLayout } from '@/features/account-settings';
import { CyodSettingsPage } from '@/features/account-settings/pages/cyod-settings';
import { DeveloperSettingsPage } from '@/features/account-settings/pages/developer-settings';
import { GeneralSettingsPage } from '@/features/account-settings/pages/general';
import { NotificationSettingsPage } from '@/features/account-settings/pages/notification-settings';
import { SecuritySettingsPage } from '@/features/account-settings/pages/security';

/*
  Account settings, as one component.

  Its tabs are links and it asks which one is open, so unlike a screen that
  only reads data it needs a router. That router is built here, for this screen
  alone: the paths are the ones the tabs name, and nothing else is in it. The
  host renders `<AccountSettings />` and gives it nothing.

  The history is in memory, so moving between tabs is this screen's business
  and the host's own routing never sees it. The address bar is then written to
  match, which keeps a tab linkable and the URL honest.
*/

const SETTINGS_BASE = '/dashboard/settings';

/** Where the screen opens when the address names no tab of this screen. */
const DEFAULT_TAB = `${SETTINGS_BASE}/general`;

/** The tab the address names, or the default where it names none of them. */
function openingTab() {
  const { pathname } = window.location;

  return pathname.startsWith(SETTINGS_BASE) ? pathname : DEFAULT_TAB;
}

const rootRoute = createRootRoute({ component: Outlet });

/*
  The signed-in account, under the id the panes ask for it by. It matches no
  path of its own; it is here so `useSignedInUser` finds the session where it
  looks for it.
*/
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => ({ session: getStoredSession() }),
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: SETTINGS_BASE,
  component: AccountSettingsLayout,
});

const tabRoutes = [
  { path: 'general', component: GeneralSettingsPage },
  { path: 'security', component: SecuritySettingsPage },
  { path: 'developersettings', component: DeveloperSettingsPage },
  { path: 'cyod-settings', component: CyodSettingsPage },
  { path: 'notification-settings', component: NotificationSettingsPage },
].map(({ path, component }) =>
  createRoute({ getParentRoute: () => settingsRoute, path, component })
);

/* The screen has no landing pane; asked for no tab, it opens the general one. */
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

/** The account settings screen, tabs and all. */
export function AccountSettings() {
  /* Built once per mount, so the screen opens at the address the host is at. */
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [openingTab()] }),
    })
  );

  /*
    The address bar follows the open tab. It replaces rather than pushes, so
    the tabs add no history entries and Back leaves the screen, and it carries
    the existing state object over so the host's own routing keeps its record.
  */
  useEffect(() => {
    const mirrorTabInAddressBar = () => {
      const { pathname } = router.state.location;

      if (pathname !== window.location.pathname) {
        window.history.replaceState(window.history.state, '', pathname);
      }
    };

    mirrorTabInAddressBar();

    return router.subscribe('onResolved', mirrorTabInAddressBar);
  }, [router]);

  return <RouterProvider router={router} />;
}
