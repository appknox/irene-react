import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe } from '@tests/factories';
import { renderWithRouterContext } from '@tests/render';
import { server } from '@tests/server';

import { NOTIFICATION_MAP } from './notification-map';

const organization = buildOrganization();
const NAMESPACE_ID = 7;

const CONTEXT = {
  namespace_id: NAMESPACE_ID,
  namespace_value: 'com.afwsamples',
  namespace_created_on: '2026-09-01T10:00:00Z',
  platform_display: 'Android',
  requester_username: 'ada',
  store_url: '',
};

/** Answers the namespace with the given standing, or with a 404 for one that was rejected. */
const mockNamespace = (namespace: { is_approved: boolean } | null) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.namespace(organization.id, NAMESPACE_ID)}`, () =>
      namespace
        ? HttpResponse.json({ id: NAMESPACE_ID, value: 'com.afwsamples', ...namespace })
        : HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    )
  );

const renderRequest = (context: Record<string, unknown> = CONTEXT) =>
  renderWithRouterContext(NOTIFICATION_MAP.NF_NSREQSTD1(context, 'NF_NSREQSTD1'));

describe('NotificationNamespaceMessage', () => {
  beforeEach(() => {
    organizationStore.getState().select(organization, buildOrganizationMe());
  });

  it('offers to approve or reject a request nobody has settled', async () => {
    mockNamespace({ is_approved: false });

    renderRequest();

    expect(await screen.findByRole('button', { name: akMT('approve') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('reject') })).toBeInTheDocument();
  });

  it('states that the namespace was approved rather than offering to approve it again', async () => {
    mockNamespace({ is_approved: true });

    renderRequest();

    await waitFor(() =>
      expect(document.querySelector('[data-test-namespace-approved]')).toBeInTheDocument()
    );

    expect(screen.queryByRole('button', { name: akMT('approve') })).not.toBeInTheDocument();
  });

  it('states that the namespace was rejected when it is no longer there', async () => {
    mockNamespace(null);

    renderRequest();

    await waitFor(() =>
      expect(document.querySelector('[data-test-namespace-rejected]')).toBeInTheDocument()
    );
  });

  it('approves the namespace from the approve button', async () => {
    let approved = false;

    mockNamespace({ is_approved: false });

    server.use(
      http.put(`*/${OrganizationEndpoints.namespace(organization.id, NAMESPACE_ID)}`, () => {
        approved = true;

        return HttpResponse.json({ id: NAMESPACE_ID, is_approved: true });
      })
    );

    renderRequest();

    await userEvent.click(await screen.findByRole('button', { name: akMT('approve') }));

    await waitFor(() => expect(approved).toBe(true));
  });

  it('rejects the namespace from the reject button', async () => {
    let rejected = false;

    mockNamespace({ is_approved: false });

    server.use(
      http.delete(`*/${OrganizationEndpoints.namespace(organization.id, NAMESPACE_ID)}`, () => {
        rejected = true;

        return new HttpResponse(null, { status: 204 });
      })
    );

    renderRequest();

    await userEvent.click(await screen.findByRole('button', { name: akMT('reject') }));

    await waitFor(() => expect(rejected).toBe(true));
  });

  it('links to the store listing when the request came from one', async () => {
    mockNamespace({ is_approved: true });

    renderRequest({ ...CONTEXT, store_url: 'https://play.google.com/store/apps/details?id=x' });

    expect(
      await screen.findByRole('link', { name: akMT('notificationModule.viewAppOnStore') })
    ).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=x');
  });
});
