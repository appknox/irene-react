import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  mockSkDiscovery,
  mockSkRequestedApps,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { buildPendingSkRequestedApp, buildSkApp, buildSkDiscoveryResult } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const RESULTS = '/dashboard/storeknox/discover/result';

async function searchFor(query: string) {
  await userEvent.type(
    await screen.findByRole('textbox', { name: akMT('storeknox.searchQuery') }),
    query
  );

  await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.discoverHeader') }));
}

describe('the discovery search', () => {
  it('invites a search before one has run', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    await renderAtRoute(RESULTS);

    expect(await screen.findByText(akMT('storeknox.searchForApps'))).toBeInTheDocument();

    expect(screen.getByRole('button', { name: akMT('storeknox.discoverHeader') })).toBeDisabled();
  });

  it('starts a search on the server and lists what it found under the query', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult();
    const { search, sent } = mockSkDiscovery([result]);

    const { router } = await renderAtRoute(RESULTS);

    await searchFor(search.query_str);

    expect(await screen.findByText(result.title)).toBeInTheDocument();
    expect(screen.getByText(result.package_name)).toBeInTheDocument();
    expect(screen.getByText(`"${search.query_str}"`)).toBeInTheDocument();
    expect(sent.query).toBe(search.query_str);

    expect(router.state.location.search).toMatchObject({
      app_query: search.query_str,
      app_search_id: search.id,
    });
  });

  it('spins the Discover button while the server starts the search', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult();
    const { search } = mockSkDiscovery([result]);
    let answer: (() => void) | undefined;

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.discovery()), async () => {
        await new Promise<void>((resolve) => {
          answer = resolve;
        });

        return HttpResponse.json(search);
      })
    );

    await renderAtRoute(RESULTS);

    await searchFor(search.query_str);

    const discover = screen.getByRole('button', { name: akMT('storeknox.discoverHeader') });

    await waitFor(() => expect(discover).toHaveAttribute('aria-busy', 'true'));

    answer?.();

    expect(await screen.findByText(result.title)).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: akMT('storeknox.discoverHeader') })
    ).not.toHaveAttribute('aria-busy');
  });

  it('refuses a one-character query with irene’s message', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { sent } = mockSkDiscovery();

    await renderAtRoute(RESULTS);

    await searchFor('a');

    expect(await screen.findByText(akMT('storeknox.errorSearchCharacter'))).toBeInTheDocument();
    expect(sent.query).toBeUndefined();
  });

  it('clears the field from its own button', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    await renderAtRoute(RESULTS);

    const field = await screen.findByRole('textbox', { name: akMT('storeknox.searchQuery') });

    await userEvent.type(field, 'maps');
    await userEvent.click(screen.getByRole('button', { name: akMT('clear') }));

    expect(field).toHaveValue('');
  });

  it('says when a search found nothing', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery([]);

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    expect(await screen.findByText(akMT('storeknox.noResultFound'))).toBeInTheDocument();
  });

  it('says why a search would not start, and still invites another', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const reason = 'Search limit reached';

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.discovery()), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(RESULTS);

    await searchFor('maps');

    expect(await screen.findByText(reason)).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.searchForApps'))).toBeInTheDocument();
  });

  it('opens the full disclaimer', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    await renderAtRoute(RESULTS);

    await userEvent.click(await screen.findByRole('button', { name: akMT('viewMore') }));

    expect(screen.getByText(akMT('storeknox.disclaimerLabel'))).toBeInTheDocument();

    const dialog = await screen.findByRole('dialog', { name: akMT('storeknox.disclaimer') });

    expect(
      within(dialog).getByText(akMT('storeknox.disclaimerHeader'), { selector: 'h5, h5 *' })
    ).toBeInTheDocument();
  });
});

describe('a search result’s action', () => {
  it('adds an owner’s pick to the inventory, and marks it as there', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult();
    const { search } = mockSkDiscovery([result]);
    let body: unknown;

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(buildSkApp());
      })
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.addToInventory') })
    );

    expect(
      await screen.findByText(akMT('storeknox.appAddedToInventory', { appName: result.title }))
    ).toBeInTheDocument();

    expect(body).toEqual({ doc_ulid: result.doc_ulid, app_discovery_query: String(search.id) });

    expect(
      screen.getByRole('img', { name: akMT('storeknox.appAlreadyExists') })
    ).toBeInTheDocument();
  });

  it('sends a member’s pick to an owner, and marks it as asked for', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult();
    const { search } = mockSkDiscovery([result]);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json(
          buildSkApp({ approval_status: ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL })
        )
      )
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.sendRequest') })
    );

    expect(
      await screen.findByText(akMT('storeknox.appRequested', { appName: result.title }))
    ).toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: akMT('storeknox.appAlreadyRequested') })
    ).toBeInTheDocument();
  });

  it('lists a member’s request on the requests tab, even when that tab was already open', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkRequestedApps([]);

    const result = buildSkDiscoveryResult();
    const { search } = mockSkDiscovery([result]);

    const request = buildPendingSkRequestedApp();

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json(
          buildSkApp({ approval_status: ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL })
        )
      )
    );

    const { router } = await renderAtRoute('/dashboard/storeknox/discover/requested');

    expect(await screen.findByText(akMT('storeknox.noRequestedAppsFound'))).toBeInTheDocument();

    await router.navigate({
      to: RESULTS,
      search: { app_query: search.query_str, app_search_id: search.id },
    });

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.sendRequest') })
    );

    expect(
      await screen.findByText(akMT('storeknox.appRequested', { appName: result.title }))
    ).toBeInTheDocument();

    mockSkRequestedApps([request]);

    await userEvent.click(screen.getByRole('tab', { name: akMT('storeknox.requestedApps') }));

    expect(await screen.findByText(request.app_metadata.title)).toBeInTheDocument();
  });

  it('leaves the action empty for a listing the server gave no ulid', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult({ doc_ulid: '' });
    const { search } = mockSkDiscovery([result]);

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    const row = (await screen.findByText(result.title)).closest('tr') as HTMLElement;

    await waitFor(() => expect(within(row).getAllByRole('cell').at(-1)).toBeEmptyDOMElement());
  });

  it('marks listings already in the inventory or already asked for, with no button', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const added = buildSkDiscoveryResult();
    const requested = buildSkDiscoveryResult();

    const { search } = mockSkDiscovery([added, requested], {
      [added.doc_ulid]: ENUMS.SK_APPROVAL_STATUS.APPROVED,
      [requested.doc_ulid]: ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL,
    });

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    expect(
      await screen.findByRole('img', { name: akMT('storeknox.appAlreadyExists') })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: akMT('storeknox.appAlreadyRequested') })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: akMT('storeknox.addToInventory') })
    ).not.toBeInTheDocument();
  });

  it('says why an addition failed and keeps the button', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const result = buildSkDiscoveryResult();
    const { search } = mockSkDiscovery([result]);
    const reason = 'No licences left';

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.addToInventory') })
    );

    expect(await screen.findByText(reason)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: akMT('storeknox.addToInventory') })
      ).toBeInTheDocument()
    );
  });

  it('explains the action to an owner and to a member', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery([buildSkDiscoveryResult()]);

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    expect(
      await screen.findByRole('img', { name: akMT('storeknox.actionHeaderInfo') })
    ).toBeInTheDocument();
  });
});

describe('a search that goes wrong', () => {
  it('keeps the add button when the server cannot say where a listing stands', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery([buildSkDiscoveryResult()]);

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.approvalStatusCheck()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    expect(
      await screen.findByRole('button', { name: akMT('storeknox.addToInventory') })
    ).toBeInTheDocument();
  });

  it('says why the results would not load', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery();
    const reason = 'Search expired';

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.discoveryResults(search.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    expect(await screen.findByText(reason)).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.noResultFound'))).toBeInTheDocument();
  });

  it('shows the addition in progress until the server answers', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery([buildSkDiscoveryResult()]);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.addToInventory') })
    );

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('lets the mark of a just-added app explain itself once the pointer has left it', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const { search } = mockSkDiscovery([buildSkDiscoveryResult()]);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.apps()), () => HttpResponse.json(buildSkApp()))
    );

    await renderAtRoute(
      `${RESULTS}?app_query=${encodeURIComponent(search.query_str)}&app_search_id=${search.id}`
    );

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.addToInventory') })
    );

    const mark = await screen.findByRole('img', { name: akMT('storeknox.appAlreadyExists') });

    await userEvent.unhover(mark);
    await userEvent.hover(mark);

    expect(
      await screen.findByRole('tooltip', { name: akMT('storeknox.appAlreadyExists') })
    ).toBeInTheDocument();
  });
});
