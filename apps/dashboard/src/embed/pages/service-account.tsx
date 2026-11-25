import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type AnyRouter,
} from '@tanstack/react-router';

import { useEffect, useState } from 'react';

import { getStoredSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';
import { OrganizationServiceAccountPage } from '@/features/organization/pages/service-account';
import { OrganizationServiceAccountCreatePage } from '@/features/organization/pages/service-account/create';
import { OrganizationServiceAccountDetailsPage } from '@/features/organization/pages/service-account/details';

/*
  The service accounts, as one component.

  The list, the screen an account is made on and an account's own screen are
  three URLs of one screen, so they are three routes of one router: moving
  between them is this screen's business and never reloads the document, which
  is what mounting each of them separately would have cost.
*/

const SERVICE_ACCOUNT_BASE = ORGANIZATION_SETTINGS_TABS.serviceAccount;

/** Where the screen opens when the address names none of its own URLs. */
const DEFAULT_SCREEN = SERVICE_ACCOUNT_BASE;

/** The screen the address names, or the list where it names none of them. */
function openingScreen() {
  const { pathname, search } = window.location;

  return pathname.startsWith(SERVICE_ACCOUNT_BASE) ? `${pathname}${search}` : DEFAULT_SCREEN;
}

const rootRoute = createRootRoute({ component: Outlet });

/*
  The signed-in account, under the id the screens ask for it by. It matches no
  path of its own; it is here so they find the session where they look.
*/
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => ({ session: getStoredSession() }),
});

/*
  The two pages above these, which this screen never opens: the host serves them. They are
  declared so the trail can read what they are called, the same way it reads them from the
  routes in this app's own tree.
*/
const organizationCrumbRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: ORGANIZATION_TABS.users,
  staticData: { breadcrumb: () => ({ title: akMT('organization') }) },
});

const settingsCrumbRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: ORGANIZATION_SETTINGS_TABS.settings,

  staticData: {
    breadcrumb: () => ({ title: akMT('settings'), parent: ORGANIZATION_TABS.users }),
  },
});

const listRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: SERVICE_ACCOUNT_BASE,
  component: OrganizationServiceAccountPage,
  validateSearch: (search: Record<string, unknown>) => search,
  staticData: {
    pageTitle: () => akMT('serviceAccount'),

    breadcrumb: () => ({
      title: akMT('serviceAccount'),
      parent: ORGANIZATION_SETTINGS_TABS.settings,
    }),
  },
});

const createRouteDefinition = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: `${SERVICE_ACCOUNT_BASE}/create`,
  component: OrganizationServiceAccountCreatePage,
  validateSearch: (search: Record<string, unknown>) => search,
  staticData: {
    pageTitle: () => akMT('serviceAccountModule.createPageTitle'),

    breadcrumb: () => ({ title: akMT('create'), parent: SERVICE_ACCOUNT_BASE }),
  },
});

/* An account's own screen, which the list and the create screen both lead to. */
const detailsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: `${SERVICE_ACCOUNT_BASE}/$serviceAccountId`,

  staticData: {
    pageTitle: () => akMT('serviceAccountModule.detailsPageTitle'),

    breadcrumb: () => ({ title: akMT('viewOrEdit'), parent: SERVICE_ACCOUNT_BASE }),
  },

  component: function ServiceAccountDetails() {
    const { serviceAccountId } = detailsRoute.useParams();

    return <OrganizationServiceAccountDetailsPage serviceAccountId={Number(serviceAccountId)} />;
  },
});

const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([
    organizationCrumbRoute,
    settingsCrumbRoute,
    listRoute,
    createRouteDefinition,
    detailsRoute,
  ]),
]);

/** What the open screen is called, for the browser tab. */
const openScreenTitle = (router: AnyRouter) => {
  const match = router.state.matches.at(-1);

  return match?.staticData.pageTitle?.(match) ?? '';
};

/** The service accounts, list and all. */
export function ServiceAccount() {
  /* Built once per mount, so the screen opens at the address the host is at. */
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [openingScreen()] }),
    })
  );

  /*
    The address bar follows the open screen, so a reload or a shared link lands
    on the same one. It replaces rather than pushes: the host's own routing
    keeps its record, and Back leaves the screen rather than walking it.
  */
  useEffect(() => {
    const mirrorScreenInAddressBar = () => {
      const { pathname, searchStr } = router.state.location;
      const address = `${pathname}${searchStr}`;

      if (address !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(window.history.state, '', address);
      }
    };

    mirrorScreenInAddressBar();

    return router.subscribe('onResolved', mirrorScreenInAddressBar);
  }, [router]);

  /*
    The browser tab is named by the open screen's route, which carries the whole title irene
    gives that page rather than one part of it. The host's own title stands where a route
    names none, and is put back when the screen is taken down.
  */
  useEffect(() => {
    const hostTitle = document.title;

    const nameScreenInBrowserTab = () => {
      const screen = openScreenTitle(router);

      document.title = screen === '' ? hostTitle : screen;
    };

    nameScreenInBrowserTab();

    const stopFollowing = router.subscribe('onResolved', nameScreenInBrowserTab);

    return () => {
      stopFollowing();
      document.title = hostTitle;
    };
  }, [router]);

  return <RouterProvider router={router} />;
}
