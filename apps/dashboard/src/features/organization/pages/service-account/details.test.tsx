import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  SERVICE_ACCOUNT_TYPE,
  ServiceAccountEndpoints,
  type ApiServiceAccount,
} from '@irene/api/services/service-account';

import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationUser,
  buildSession,
} from '@tests/factories';

import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationServiceAccountDetailsPage } from './details';
import { NO_SCOPES } from './scopes';

const ACCOUNT_ID = 9;

const ACCOUNT: ApiServiceAccount = {
  id: ACCOUNT_ID,
  name: 'CI uploads',
  description: 'Used by the build',
  access_key_id: 'AKIAEXAMPLE',
  expiry: null,
  is_expired: false,
  is_active: true,
  all_projects: true,
  service_account_type: SERVICE_ACCOUNT_TYPE.user,
  created_on: '2026-01-01T00:00:00Z',
  updated_on: '2026-01-02T00:00:00Z',
  created_by_user: 3,
  updated_by_user: null,
  ...NO_SCOPES,
};

/** What the account endpoint was last sent. */
let sent: Record<string, unknown> | null = null;

const renderDetails = () =>
  renderAtAddress(
    <Fragment>
      <OrganizationServiceAccountDetailsPage serviceAccountId={ACCOUNT_ID} />

      <AkToaster />
    </Fragment>,
    `/dashboard/organization/settings/service-account/${ACCOUNT_ID}`
  );

beforeEach(() => {
  sent = null;
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  server.use(
    http.get(`*/${ServiceAccountEndpoints.detail(ACCOUNT_ID)}`, () => HttpResponse.json(ACCOUNT)),

    http.put(`*/${ServiceAccountEndpoints.detail(ACCOUNT_ID)}`, async ({ request }) => {
      sent = (await request.json()) as Record<string, unknown>;

      return HttpResponse.json({ ...ACCOUNT, ...sent });
    }),

    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username: 'ali', email: 'ali@example.test' }))
    )
  );
});

describe('an account’s own screen', () => {
  it('reads the account across its sections', async () => {
    renderDetails();

    expect(await screen.findByText('CI uploads')).toBeInTheDocument();
    expect(screen.getByText('Used by the build')).toBeInTheDocument();
    expect(screen.getByText('AKIAEXAMPLE')).toBeInTheDocument();
    expect(screen.getByText(akMT('noExpiry'))).toBeInTheDocument();
    expect(screen.getByText(akMT('selectedScope'))).toBeInTheDocument();
  });

  it('writes a changed name and description on their own section', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(await screen.findByLabelText(`${akMT('edit')} ${akMT('accountOverview')}`));

    const name = document.querySelector(
      '[data-test-service-account-name-input]'
    ) as HTMLInputElement;

    await user.clear(name);
    await user.type(name, 'Nightly uploads');

    await user.click(
      document.querySelector('[data-test-service-account-overview-save]') as HTMLElement
    );

    await waitFor(() => expect(sent).not.toBeNull());

    /* The account goes back entire, with the two changed fields written over it. */
    expect(sent).toStrictEqual({
      ...ACCOUNT,
      name: 'Nightly uploads',
      description: 'Used by the build',
    });

    expect(
      await screen.findByText(akMT('serviceAccountModule.editSuccessMsg'))
    ).toBeInTheDocument();
  });

  it('writes changed scopes, leaving the rest of the account as it stands', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(await screen.findByLabelText(`${akMT('edit')} ${akMT('selectedScope')}`));

    const row = document.querySelector('[data-test-ak-tree-row="team-operations"]') as HTMLElement;

    await user.click(within(row).getByRole('checkbox'));

    await user.click(
      document.querySelector('[data-test-service-account-scope-save]') as HTMLElement
    );

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toStrictEqual({ ...ACCOUNT, scope_public_api_team_operations: true });
  });

  it('leaves a section as it was when the change is cancelled', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(await screen.findByLabelText(`${akMT('edit')} ${akMT('accountOverview')}`));

    await user.click(
      document.querySelector('[data-test-service-account-overview-cancel]') as HTMLElement
    );

    expect(await screen.findByText('CI uploads')).toBeInTheDocument();
    expect(sent).toBeNull();
  });

  it('issues a new key and shows the secret it was answered with', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${ServiceAccountEndpoints.keyReset(ACCOUNT_ID)}`, () =>
        HttpResponse.json({ ...ACCOUNT, secret_access_key: 'fresh' })
      )
    );

    renderDetails();

    await user.click(await screen.findByLabelText(akMT('serviceAccountModule.refreshAccessToken')));

    await user.click(
      document.querySelector('[data-test-service-account-token-save]') as HTMLElement
    );

    expect(await screen.findByText('fresh')).toBeInTheDocument();
  });

  it('says what went wrong where a change is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${ServiceAccountEndpoints.detail(ACCOUNT_ID)}`, () =>
        HttpResponse.json({ detail: 'Not permitted' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    renderDetails();

    await user.click(await screen.findByLabelText(`${akMT('edit')} ${akMT('selectedScope')}`));

    await user.click(
      document.querySelector('[data-test-service-account-scope-save]') as HTMLElement
    );

    expect(await screen.findByText('Not permitted')).toBeInTheDocument();
  });
});
