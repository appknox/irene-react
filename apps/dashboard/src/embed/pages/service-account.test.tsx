import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { ServiceAccountEndpoints } from '@irene/api/services/service-account';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { server } from '@tests/server';

import { EmbedProviders } from '../providers';
import { ServiceAccount } from './service-account';

const LIST_ADDRESS = '/dashboard/organization/settings/service-account';

const renderScreen = () =>
  render(
    <EmbedProviders>
      <ServiceAccount />
    </EmbedProviders>
  );

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  window.history.replaceState({}, '', LIST_ADDRESS);

  server.use(
    http.get(`*/${ServiceAccountEndpoints.list()}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    ),

    http.get(`*/${OrganizationEndpoints.projects('*')}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    )
  );
});

describe('the embedded service account screen', () => {
  it('opens on the list at the address the host is at', async () => {
    renderScreen();

    expect(await screen.findByText(akMT('serviceAccountModule.emptyTitle'))).toBeInTheDocument();
  });

  it('opens on the create screen where the address names it', async () => {
    window.history.replaceState({}, '', `${LIST_ADDRESS}/create`);

    renderScreen();

    expect(await screen.findByText(akMT('serviceAccountModule.createTitle'))).toBeInTheDocument();
  });

  it('sends the create control to the create address as a document load', async () => {
    renderScreen();

    await screen.findByText(akMT('serviceAccountModule.emptyTitle'));

    /* Create is an Ember route of its own, so the link hands the address to the host. */
    expect(document.querySelector('[data-test-service-accounts-create]')).toHaveAttribute(
      'href',
      `${LIST_ADDRESS}/create`
    );
  });

  it('sends cancel back to the list address as a document load', async () => {
    window.history.replaceState({}, '', `${LIST_ADDRESS}/create`);

    renderScreen();

    await screen.findByText(akMT('serviceAccountModule.createTitle'));

    expect(document.querySelector('[data-test-service-account-create-cancel]')).toHaveAttribute(
      'href',
      LIST_ADDRESS
    );
  });

  it('names the open screen in the browser tab', async () => {
    document.title = 'Service Account';

    window.history.replaceState({}, '', `${LIST_ADDRESS}/create`);

    renderScreen();

    await waitFor(() => expect(document.title).toBe(`${akMT('create')} | Service Account`));
  });
});
