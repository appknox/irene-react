import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { SERVICE_ACCOUNT_TYPE, ServiceAccountEndpoints } from '@irene/api/services/service-account';
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

import { OrganizationServiceAccountPage } from './index';

const SERVICE_ACCOUNT_ADDRESS = '/dashboard/organization/settings/service-account';

const buildAccount = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  name: 'CI uploads',
  description: 'Used by the build',
  access_key_id: 'AKIAEXAMPLE',
  expiry: null,
  is_expired: false,
  is_active: true,
  all_projects: true,
  service_account_type: SERVICE_ACCOUNT_TYPE.user,
  created_on: '2026-01-01T00:00:00Z',
  updated_on: '2026-01-01T00:00:00Z',
  created_by_user: 3,
  updated_by_user: null,
  scope_public_api_user_read: true,
  scope_public_api_user_write: false,
  scope_public_api_project_read: true,
  scope_public_api_scan_result_va: false,
  scope_public_api_upload_app: true,
  scope_public_api_team_operations: false,
  scope_public_api_store_release_readiness: false,
  scope_auto_approve_new_name_spaces: false,
  scope_cli: false,
  cli_scope_auto_approve_new_name_spaces: false,
  ...overrides,
});

/** What the list is asked for, recorded so a filter can be read off it. */
let askedFor: URLSearchParams | null = null;

/** Answers the list with `accounts`, recording the query it was asked with. */
const withAccounts = (accounts: ReturnType<typeof buildAccount>[]) =>
  server.use(
    http.get(`*/${ServiceAccountEndpoints.list()}`, ({ request }) => {
      askedFor = new URL(request.url).searchParams;

      return HttpResponse.json({
        count: accounts.length,
        next: null,
        previous: null,
        results: accounts,
      });
    })
  );

const renderList = (address = SERVICE_ACCOUNT_ADDRESS) =>
  renderAtAddress(
    <Fragment>
      <OrganizationServiceAccountPage />

      <AkToaster />
    </Fragment>,
    address
  );

beforeEach(() => {
  askedFor = null;
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  server.use(
    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username: 'ali' }))
    )
  );

  withAccounts([buildAccount()]);
});

describe('the service account list', () => {
  it('lists an account with its key, expiry and who made it', async () => {
    renderList();

    expect(await screen.findByText('CI uploads')).toBeInTheDocument();
    expect(screen.getByText('AKIAEXAMPLE')).toBeInTheDocument();
    expect(screen.getByText(akMT('noExpiry'))).toBeInTheDocument();
    expect(await screen.findByText('ali')).toBeInTheDocument();
  });

  it('writes the date an account expires on rather than warning about it', async () => {
    withAccounts([buildAccount({ expiry: '2026-12-31T00:00:00Z' })]);

    renderList();

    expect(await screen.findByText('Dec 31, 2026')).toBeInTheDocument();
    expect(screen.queryByText(akMT('noExpiry'))).not.toBeInTheDocument();
  });

  it('marks what the command line may do with an account it may use', async () => {
    withAccounts([buildAccount({ scope_cli: true, all_projects: false })]);

    renderList();

    expect(await screen.findByText(akMT('serviceAccountModule.cliLabel'))).toBeInTheDocument();

    expect(screen.getByText(akMT('serviceAccountModule.memberLevelLabel'))).toBeInTheDocument();
  });

  it('leaves out the accounts the system made until they are asked for', async () => {
    const user = userEvent.setup();

    renderList();

    await screen.findByText('CI uploads');

    expect(askedFor?.get('service_account_type')).toBe(String(SERVICE_ACCOUNT_TYPE.user));

    await user.click(screen.getByLabelText(akMT('serviceAccountModule.showSystemCreated')));

    await waitFor(() => expect(askedFor?.has('service_account_type')).toBe(false));
  });

  it('narrows the list to the command line’s accounts when asked', async () => {
    const user = userEvent.setup();

    renderList();

    await screen.findByText('CI uploads');
    await user.click(screen.getByLabelText(akMT('serviceAccountModule.showCliEnabled')));

    await waitFor(() => expect(askedFor?.get('scope_cli')).toBe('true'));
  });

  it('asks for the page the address names', async () => {
    renderList(`${SERVICE_ACCOUNT_ADDRESS}?sa_limit=25&sa_offset=50&show_cli_enabled=true`);

    await screen.findByText('CI uploads');

    expect(askedFor?.get('limit')).toBe('25');
    expect(askedFor?.get('offset')).toBe('50');
    expect(askedFor?.get('scope_cli')).toBe('true');
  });

  it('keeps the page and the filters in the address', async () => {
    const user = userEvent.setup();

    const { router } = renderList();

    await screen.findByText('CI uploads');

    await user.click(screen.getByLabelText(akMT('recordPerPage')));
    await user.click(await screen.findByRole('option', { name: '25' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ sa_limit: 25 }));

    await user.click(screen.getByLabelText(akMT('serviceAccountModule.showCliEnabled')));

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        sa_limit: 25,
        sa_offset: 0,
        show_cli_enabled: true,
      })
    );
  });

  it('starts again from the first page when the page size changes', async () => {
    const user = userEvent.setup();

    renderList();

    await screen.findByText('CI uploads');

    await user.click(screen.getByLabelText(akMT('recordPerPage')));
    await user.click(await screen.findByRole('option', { name: '25' }));

    await waitFor(() => expect(askedFor?.get('limit')).toBe('25'));

    expect(askedFor?.get('offset')).toBe('0');
  });

  it('says there is nothing yet where the organization has made none', async () => {
    withAccounts([]);

    renderList();

    expect(await screen.findByText(akMT('serviceAccountModule.emptyTitle'))).toBeInTheDocument();
  });

  it('asks before withdrawing an account, naming it', async () => {
    const user = userEvent.setup();

    let withdrawn = false;

    server.use(
      http.delete(`*/${ServiceAccountEndpoints.detail(9)}`, () => {
        withdrawn = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    renderList();

    await user.click(await screen.findByLabelText(`${akMT('moreOptions')} CI uploads`));
    await user.click(await screen.findByText(akMT('delete')));

    const question = await waitFor(() => {
      const asked = document.querySelector('[data-test-service-accounts-delete-question]');

      expect(asked).not.toBeNull();

      return asked as HTMLElement;
    });

    expect(question).toHaveTextContent('CI uploads');

    const box = document.querySelector('[data-test-confirm-box]') as HTMLElement;

    await user.click(within(box).getByText(akMT('delete')));

    await waitFor(() => expect(withdrawn).toBe(true));

    expect(
      await screen.findByText(akMT('serviceAccountModule.deleteSuccessMsg'))
    ).toBeInTheDocument();
  });

  it('says what went wrong where an account cannot be withdrawn', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete(`*/${ServiceAccountEndpoints.detail(9)}`, () =>
        HttpResponse.json(
          { detail: 'In use by a pipeline' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    renderList();

    await user.click(await screen.findByLabelText(`${akMT('moreOptions')} CI uploads`));
    await user.click(await screen.findByText(akMT('delete')));

    const box = (await waitFor(() =>
      document.querySelector('[data-test-confirm-box]')
    )) as HTMLElement;

    await user.click(within(box).getByText(akMT('delete')));

    expect(await screen.findByText('In use by a pipeline')).toBeInTheDocument();
  });
});
