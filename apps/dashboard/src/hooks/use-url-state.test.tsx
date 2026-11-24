import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useUrlState } from './use-url-state';

const DEFAULTS = { page_limit: 10, page_offset: 0, page_query: '', page_all: false };

/** A screen that reports the state it reads and changes part of it on demand. */
function Screen() {
  const [state, changeState] = useUrlState(DEFAULTS);

  return (
    <div>
      <output data-testid="state">{JSON.stringify(state)}</output>

      <button type="button" onClick={() => changeState({ page_offset: 20 })}>
        Next page
      </button>
    </div>
  );
}

/** Opens the screen at one address, under a router of its own. */
const renderAt = (address: string) => {
  const rootRoute = createRootRoute();

  const screenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$',

    /* Taken as it comes, as the screens that use this hook take it. */
    validateSearch: (search: Record<string, unknown>) => search,
    component: Screen,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([screenRoute]),
    history: createMemoryHistory({ initialEntries: [address] }),
  });

  return { router, ...render(<RouterProvider router={router} />) };
};

/** The state the screen is reporting. */
const reportedState = async () => JSON.parse((await screen.findByTestId('state')).textContent ?? '');

describe('useUrlState', () => {
  it('falls back to the defaults where the address names nothing', async () => {
    renderAt('/list');

    await expect(reportedState()).resolves.toEqual(DEFAULTS);
  });

  it('reads counts, flags and text from the address', async () => {
    renderAt('/list?page_limit=25&page_offset=50&page_query=ab&page_all=true');

    await expect(reportedState()).resolves.toEqual({
      page_limit: 25,
      page_offset: 50,
      page_query: 'ab',
      page_all: true,
    });
  });

  it('falls back where a count in the address is not one', async () => {
    renderAt('/list?page_limit=none&page_offset=-5');

    await expect(reportedState()).resolves.toMatchObject({ page_limit: 10, page_offset: 0 });
  });

  it('writes a change to the address and reports it', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/list');

    await user.click(await screen.findByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ page_offset: 20 }));

    await expect(reportedState()).resolves.toMatchObject({ page_offset: 20 });
  });

  it('leaves parameters it was not given alone', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/list?other=kept');

    await user.click(await screen.findByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ other: 'kept' }));
  });

  it('adds no history entry, so Back leaves the screen', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/list');

    const entries = router.history.length;

    await user.click(await screen.findByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ page_offset: 20 }));

    expect(router.history.length).toBe(entries);
  });

  it('follows the address when it changes under the screen', async () => {
    const { router } = renderAt('/list');

    /* Through the router's own history, as the host's routing changes it under an embedded screen. */
    await act(async () => {
      router.history.replace('/list?page_offset=30');

      await Promise.resolve();
    });

    await expect(reportedState()).resolves.toMatchObject({ page_offset: 30 });
  });
});
