import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AkRouterLink } from '@irene/ui/ak-router-link';

/** A router of two screens, one linking to the other. */
const renderLinkedScreens = () => {
  const rootRoute = createRootRoute();

  const fromRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/from',
    component: () => (
      <AkRouterLink to="/to" search={{ q: 'platform' }} color="primary">
        Go
      </AkRouterLink>
    ),
  });

  const toRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/to',
    validateSearch: (search: Record<string, unknown>) => search,
    component: () => <p>Arrived</p>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([fromRoute, toRoute]),
    history: createMemoryHistory({ initialEntries: ['/from'] }),
  });

  return { router, ...render(<RouterProvider router={router} />) };
};

describe('AkRouterLink', () => {
  it('renders the address the route and its search describe', async () => {
    renderLinkedScreens();

    expect(await screen.findByRole('link', { name: 'Go' })).toHaveAttribute(
      'href',
      '/to?q=platform'
    );
  });

  it('is styled as a link of the design system', async () => {
    renderLinkedScreens();

    expect(await screen.findByRole('link', { name: 'Go' })).toHaveAttribute('data-slot', 'link');
  });

  /* The point of it: the screen changes without the document being loaded again. */
  it('navigates through the router rather than the browser', async () => {
    const user = userEvent.setup();
    const { router } = renderLinkedScreens();

    await user.click(await screen.findByRole('link', { name: 'Go' }));

    expect(await screen.findByText('Arrived')).toBeInTheDocument();

    await waitFor(() => expect(router.state.location.pathname).toBe('/to'));

    expect(router.state.location.search).toMatchObject({ q: 'platform' });
  });
});
