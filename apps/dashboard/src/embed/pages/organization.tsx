import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
  type AnyRouter,
} from '@tanstack/react-router';

import { useEffect, useState } from 'react';

import { getStoredSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { OrganizationLayout, OrganizationSettingsWrapper } from '@/features/organization';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';
import { OrganizationAiPoweredFeaturesPage } from '@/features/organization/pages/ai-powered-features';
import { OrganizationIntegrationsPage } from '@/features/organization/pages/integrations';
import { OrganizationNamespacesPage } from '@/features/organization/pages/namespaces';
import { OrganizationServiceAccountPage } from '@/features/organization/pages/service-account';
import { OrganizationServiceAccountCreatePage } from '@/features/organization/pages/service-account/create';
import { OrganizationServiceAccountDetailsPage } from '@/features/organization/pages/service-account/details';
import { OrganizationSettingsPage } from '@/features/organization/pages/settings';
import { OrganizationTeamsPage } from '@/features/organization/pages/teams';
import { OrganizationUsersPage } from '@/features/organization/pages/users';

/*
  The whole organization area, as one component.

  Every page under /dashboard/organization is a route of this one router: the
  three organization panes, the four settings tabs, and the two service account
  screens that sit outside the settings chrome. One router over all of them is
  what lets a reader move from any of these pages to any other without the
  document being fetched again — which is why it is mounted once rather than a
  screen per host route.

  The history is in memory, so that movement is this screen's business and the
  host's own routing never sees it. The address bar is then written to match,
  which keeps every page linkable and the URL honest.
*/

const ORGANIZATION_BASE = '/dashboard/organization';

/* What sits between the open page and the page the host named, as this app's own tabs read. */
const TITLE_SEPARATOR = ' | ';

/** Where the screen opens when the address names none of its pages. */
const DEFAULT_PAGE = ORGANIZATION_TABS.namespaces;

/** The page the address names, or the default where it names none of them. */
function openingPage() {
  const { pathname, search } = window.location;

  return pathname.startsWith(ORGANIZATION_BASE) ? `${pathname}${search}` : DEFAULT_PAGE;
}

const rootRoute = createRootRoute({ component: Outlet });

/*
  The signed-in account, under the id the pages ask for it by. It matches no
  path of its own; it is here so they find the session where they look.
*/
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => ({ session: getStoredSession() }),
});

/* The organization's own panes, which its tabs sit above. */
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
const paneRoutes = [
  {
    path: 'namespaces',
    component: OrganizationNamespacesPage,
    title: () => akMT('namespaces'),
  },
  { path: 'users', component: OrganizationUsersPage, title: () => akMT('users') },
  { path: 'teams', component: OrganizationTeamsPage, title: () => akMT('teams') },
].map(({ path, component, title }) =>
  createRoute({
    getParentRoute: () => organizationRoute,
    path,
    component,
    validateSearch: (search: Record<string, unknown>) => search,

    staticData: {
      pageTitle: title,

      /* The root of the organization's trail: irene draws nothing above it. */
      breadcrumb: () => ({ title: akMT('organization') }),
    },
  })
);

/* The organization has no landing pane; asked for none, it opens the first. */
const organizationIndexRoute = createRoute({
  getParentRoute: () => organizationRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: DEFAULT_PAGE, replace: true });
  },
});

/* The settings, which their own tabs sit above. */
const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: ORGANIZATION_SETTINGS_TABS.settings,
  component: OrganizationSettingsWrapper,

  staticData: {
    breadcrumb: () => ({ title: akMT('settings'), parent: ORGANIZATION_TABS.users }),
  },
});

const settingsTabRoutes = [
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

    staticData: {
      pageTitle: title,
      breadcrumb: () => ({ title: title(), parent: ORGANIZATION_SETTINGS_TABS.settings }),
    },
  })
);

/* Asked for no tab, the settings draw themselves, as irene's index route does. */
const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: OrganizationSettingsPage,
  staticData: { pageTitle: () => akMT('settings') },
});

/*
  The two service account screens. They are pages of their own rather than tabs:
  irene puts them outside the settings chrome, so they hang off the signed-in
  route rather than off the settings.
*/
const serviceAccountCreateRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: `${ORGANIZATION_SETTINGS_TABS.serviceAccount}/create`,
  component: OrganizationServiceAccountCreatePage,
  validateSearch: (search: Record<string, unknown>) => search,

  staticData: {
    pageTitle: () => akMT('serviceAccountModule.createPageTitle'),

    breadcrumb: () => ({
      title: akMT('create'),
      parent: ORGANIZATION_SETTINGS_TABS.serviceAccount,
    }),
  },
});

const serviceAccountDetailsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: `${ORGANIZATION_SETTINGS_TABS.serviceAccount}/$serviceAccountId`,

  staticData: {
    pageTitle: () => akMT('serviceAccountModule.detailsPageTitle'),

    breadcrumb: () => ({
      title: akMT('viewOrEdit'),
      parent: ORGANIZATION_SETTINGS_TABS.serviceAccount,
    }),
  },

  component: function ServiceAccountDetails() {
    const { serviceAccountId } = serviceAccountDetailsRoute.useParams();

    return <OrganizationServiceAccountDetailsPage serviceAccountId={Number(serviceAccountId)} />;
  },
});

const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([
    organizationRoute.addChildren([organizationIndexRoute, ...paneRoutes]),
    serviceAccountCreateRoute,
    serviceAccountDetailsRoute,
    settingsRoute.addChildren([settingsIndexRoute, ...settingsTabRoutes]),
  ]),
]);

/** What the open page is called, for the browser tab. The routes name it as this app's own do. */
const openPageTitle = (router: AnyRouter) => {
  const match = router.state.matches.at(-1);

  return match?.staticData.pageTitle?.(match) ?? '';
};

/** Every page of the organization, under one router. */
export function Organization() {
  /* Built once per mount, so the screen opens at the address the host is at. */
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [openingPage()] }),

      /* An address none of these routes matches opens the first of them rather than nothing. */
      defaultNotFoundComponent: function NotFound() {
        return <Navigate to={DEFAULT_PAGE} replace />;
      },
    })
  );

  /*
    The address bar follows the open page and what that page is showing: the
    search carries each list's state, so a reload or a shared link opens the
    screen as it was left. It replaces rather than pushes, so moving between
    these pages adds no history entries and Back leaves the screen, and it
    carries the existing state object over so the host keeps its own record.
  */
  useEffect(() => {
    const mirrorPageInAddressBar = () => {
      const { pathname, searchStr } = router.state.location;
      const address = `${pathname}${searchStr}`;

      if (address !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(window.history.state, '', address);
      }
    };

    mirrorPageInAddressBar();

    return router.subscribe('onResolved', mirrorPageInAddressBar);
  }, [router]);

  /*
    The browser tab names the open page, ahead of what the host named it.

    The host's own routing does not change as these pages do, so its title
    would otherwise stay on whichever page the screen opened at. Where a page
    carries irene's whole title, that is the whole name; otherwise what the
    host set is kept as the rest of it, so the tab still reads out to the
    product.
  */
  useEffect(() => {
    const hostTitle = document.title;

    const namePageInBrowserTab = () => {
      const page = openPageTitle(router);

      if (page === '') {
        document.title = hostTitle;

        return;
      }

      document.title = page.includes(TITLE_SEPARATOR)
        ? page
        : `${page}${TITLE_SEPARATOR}${hostTitle}`;
    };

    namePageInBrowserTab();

    const stopFollowing = router.subscribe('onResolved', namePageInBrowserTab);

    return () => {
      stopFollowing();
      document.title = hostTitle;
    };
  }, [router]);

  return <RouterProvider router={router} />;
}
