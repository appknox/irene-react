import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs, type RouteBreadcrumb } from './breadcrumbs';

/** Opens a screen whose route declares the crumb given, as a real route would. */
const renderAtRouteDeclaring = (crumb?: RouteBreadcrumb) => {
  const rootRoute = createRootRoute();

  const screenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$',
    staticData: crumb === undefined ? {} : { breadcrumb: () => crumb },
    component: Breadcrumbs,
  });

  /* The pages above it, which the trail reads the way it reads any route's own crumb. */
  const organizationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard/organization/users',
    staticData: { breadcrumb: () => ({ title: 'Organization' }) },
  });

  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard/organization/settings',

    staticData: {
      breadcrumb: () => ({ title: 'Settings', parent: '/dashboard/organization/users' }),
    },
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([screenRoute, organizationRoute, settingsRoute]),
    history: createMemoryHistory({ initialEntries: ['/dashboard/organization/settings/x'] }),
  });

  return render(<RouterProvider router={router} />);
};

describe('Breadcrumbs', () => {
  /* The route declares where it sits; the trail is assembled rather than written out. */
  it('reads the trail from the open route and the pages it hangs off', async () => {
    renderAtRouteDeclaring({ title: 'Settings', parent: '/dashboard/organization/users' });

    expect(await screen.findByRole('link', { name: 'Organization' })).toHaveAttribute(
      'href',
      '/dashboard/organization/users'
    );

    expect(screen.getByText('Settings')).toHaveAttribute('aria-current', 'page');
  });

  it('reads the trail outermost first', async () => {
    renderAtRouteDeclaring({
      title: 'Service Account',
      parent: '/dashboard/organization/settings',
    });

    const steps = await screen.findAllByRole('listitem');

    expect(steps.map((step) => step.textContent)).toEqual([
      'Organization/',
      'Settings/',
      'Service Account',
    ]);
  });

  it('renders nothing where no open route names itself', () => {
    const { container } = renderAtRouteDeclaring();

    expect(container).toBeEmptyDOMElement();
  });
});
