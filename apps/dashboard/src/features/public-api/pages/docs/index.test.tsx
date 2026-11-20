import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicApiEndpoints } from '@irene/api/services/public-api/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/* Swagger UI renders a whole documentation browser; this asserts the page around it. */
vi.mock('swagger-ui-react', () => ({
  default: () => 'swagger',
}));

const DOCS_ROUTE = '/dashboard/public-api/docs';

const SPEC = {
  openapi: '3.0.0',
  info: { title: 'Public API', version: '1.0.0' },
  paths: { '/api/public_api/v1/projects': {} },
  components: {},
};

describe('PublicApiDocsPage', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());

    server.use(
      http.get(buildAPITestURL(PublicApiEndpoints.schema()), () => HttpResponse.json(SPEC))
    );
  });

  it('renders the specification once it arrives', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });

    await renderAtRoute(DOCS_ROUTE);

    expect(await screen.findByRole('tab', { name: akMT('apiEndpoints') })).toBeInTheDocument();
  });

  it('offers the service accounts link to an owner', async () => {
    mockOrganizationMe({ is_owner: true, is_admin: false });

    await renderAtRoute(DOCS_ROUTE);

    expect(
      await screen.findByRole('link', { name: akMT('goToServiceAccounts') })
    ).toBeInTheDocument();
  });

  it('offers it to an admin as well', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: true });

    await renderAtRoute(DOCS_ROUTE);

    expect(
      await screen.findByRole('link', { name: akMT('goToServiceAccounts') })
    ).toBeInTheDocument();
  });

  it('withholds it from a member who cannot create one', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });

    await renderAtRoute(DOCS_ROUTE);

    await screen.findByRole('tab', { name: akMT('apiEndpoints') });

    expect(
      screen.queryByRole('link', { name: akMT('goToServiceAccounts') })
    ).not.toBeInTheDocument();
  });
});
