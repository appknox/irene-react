import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  buildApprovedSkRequestedApp,
  buildPendingSkRequestedApp,
  buildRejectedSkRequestedApp,
} from '@tests/factories';

import {
  mockSkRequestedApps,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const REQUESTED = '/dashboard/storeknox/discover/requested';

describe('the requested apps', () => {
  it('shows each request waiting, approved or rejected, with who decided', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const waiting = buildPendingSkRequestedApp();
    const approved = buildApprovedSkRequestedApp();
    const rejected = buildRejectedSkRequestedApp();

    mockSkRequestedApps([waiting, approved, rejected]);

    await renderAtRoute(REQUESTED);

    const row = async (title: string) =>
      (await screen.findByText(title)).closest('tr') as HTMLElement;

    expect(
      within(await row(waiting.app_metadata.title)).getByText(akMT('storeknox.waitingForApproval'))
    ).toBeInTheDocument();

    const approvedRow = within(await row(approved.app_metadata.title));

    expect(approvedRow.getByText(akMT('storeknox.approved'))).toBeInTheDocument();
    expect(approvedRow.getByText(`${akMT('by')} ${approved.approved_by}`)).toBeInTheDocument();

    expect(
      approvedRow.getByRole('img', {
        name: formatDateTime(approved.approved_on, 'longDateTime'),
      })
    ).toBeInTheDocument();

    const rejectedRow = within(await row(rejected.app_metadata.title));

    expect(rejectedRow.getByText(akMT('rejected'))).toBeInTheDocument();
    expect(rejectedRow.getByText(`${akMT('by')} ${rejected.rejected_by}`)).toBeInTheDocument();
  });

  it('says there are no requests yet, and where to raise one', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkRequestedApps([]);

    await renderAtRoute(REQUESTED);

    expect(await screen.findByText(akMT('storeknox.noRequestedAppsFound'))).toBeInTheDocument();
  });

  it('turns to the next page of requests', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const received: URLSearchParams[] = [];

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.requestedApps()), ({ request }) => {
        received.push(new URL(request.url).searchParams);

        return HttpResponse.json({
          count: 25,
          next: null,
          previous: null,
          results: [buildPendingSkRequestedApp()],
        });
      })
    );

    const { router } = await renderAtRoute(REQUESTED);

    await userEvent.click(await screen.findByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(received.at(-1)?.get('offset')).toBe('10'));
    expect(router.state.location.search).toMatchObject({ app_offset: 10 });
  });

  it('says why the requests would not load', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const reason = 'Requests are unavailable';

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.requestedApps()), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(REQUESTED);

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });

  it('sends an owner, who has no requests, to the search', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { router } = await renderAtRoute(REQUESTED);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/discover/result')
    );
  });
});

describe('the discovery tabs', () => {
  it('offers a member the requests beside the search, and marks Discovery as current', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkRequestedApps([]);

    await renderAtRoute(REQUESTED);

    expect(
      await screen.findByRole('tab', { name: akMT('storeknox.requestedApps') })
    ).toHaveAttribute('aria-selected', 'true');

    expect(
      screen.getByRole('tab', { name: akMT('storeknox.discoveryResults') })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('discovery') })).toHaveAttribute(
      'aria-current',
      'page'
    );

    expect(screen.getByRole('link', { name: akMT('storeknox.appInventory') })).toHaveAttribute(
      'href',
      '/dashboard/storeknox/inventory/app-list'
    );
  });

  it('gives an owner the search alone', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    await renderAtRoute('/dashboard/storeknox/discover/result');

    expect(
      await screen.findByRole('tab', { name: akMT('storeknox.discoveryResults') })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('tab', { name: akMT('storeknox.requestedApps') })
    ).not.toBeInTheDocument();
  });
});
