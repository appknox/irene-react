import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { SERVICE_ACCOUNT_TYPE, ServiceAccountEndpoints } from '@irene/api/services/service-account';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationProject,
  buildSession,
} from '@tests/factories';

import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationServiceAccountCreatePage } from './create';

const CREATE_ADDRESS = '/dashboard/organization/settings/service-account/create';

const PROJECT = buildOrganizationProject({ id: 11, package_name: 'com.example.app', platform: 0 });

/** What the account endpoint was sent, and what it answered with. */
let sent: Record<string, unknown> | null = null;
let addedProjects: number[] = [];

const withCreateAnswering = (account: Record<string, unknown>) =>
  server.use(
    http.post(`*/${ServiceAccountEndpoints.list()}`, async ({ request }) => {
      sent = (await request.json()) as Record<string, unknown>;

      return HttpResponse.json(account);
    }),

    http.post(`*/${ServiceAccountEndpoints.projects(9)}`, async ({ request }) => {
      const body = (await request.json()) as { project_id: number };

      addedProjects.push(body.project_id);

      return HttpResponse.json({ id: 1, project: body.project_id, service_account: 9 });
    })
  );

const renderPage = () =>
  renderAtAddress(
    <Fragment>
      <OrganizationServiceAccountCreatePage />

      <AkToaster />
    </Fragment>,
    CREATE_ADDRESS
  );

/** Fills the two fields the account must carry, once the page is drawn. */
const describeAccount = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText(akMT('accountOverview'));

  await user.type(
    document.querySelector('[data-test-service-account-name-input]') as HTMLElement,
    'CI uploads'
  );

  await user.type(
    document.querySelector('[data-test-service-account-description-input]') as HTMLElement,
    'Used by the build'
  );
};

const save = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText(akMT('accountOverview'));

  await user.click(
    document.querySelector('[data-test-service-account-create-save]') as HTMLElement
  );
};

beforeEach(() => {
  sent = null;
  addedProjects = [];

  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  server.use(
    http.get(`*/${OrganizationEndpoints.projects('*')}`, () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [PROJECT] })
    )
  );

  withCreateAnswering({ id: 9, name: 'CI uploads', secret_access_key: 'shh' });
});

describe('the create page', () => {
  it('holds the four sections the account is described in', async () => {
    renderPage();

    expect(await screen.findByText(akMT('accountOverview'))).toBeInTheDocument();
    expect(screen.getByText(akMT('accessToken'))).toBeInTheDocument();
    expect(screen.getByText(akMT('selectScope'))).toBeInTheDocument();
    expect(screen.getByText(akMT('selectProject'))).toBeInTheDocument();
  });

  it('refuses to send an account with nothing said about it', async () => {
    const user = userEvent.setup();

    renderPage();

    await save(user);

    expect(await screen.findAllByText(akMT('pleaseEnterAllDetails'))).toHaveLength(2);
    expect(sent).toBeNull();
  });

  it('sends what the sections say, with every scope and the expiry', async () => {
    const user = userEvent.setup();

    renderPage();

    await describeAccount(user);

    const teamOperations = document.querySelector(
      '[data-test-ak-tree-row="team-operations"]'
    ) as HTMLElement;

    await user.click(within(teamOperations).getByRole('checkbox'));
    await save(user);

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toMatchObject({
      name: 'CI uploads',
      description: 'Used by the build',
      all_projects: true,
      service_account_type: SERVICE_ACCOUNT_TYPE.user,
      scope_public_api_team_operations: true,
      scope_public_api_user_read: false,
    });

    expect(sent?.expiry).toEqual(expect.any(String));
  });

  it('sends no expiry where the token is not to expire', async () => {
    const user = userEvent.setup();

    renderPage();

    await describeAccount(user);
    await user.click(screen.getByLabelText(akMT('serviceAccountModule.doesNotExpire')));
    await save(user);

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent?.expiry).toBeNull();
  });

  it('gives the account each chosen project once it exists', async () => {
    const user = userEvent.setup();

    renderPage();

    await describeAccount(user);

    await user.click(screen.getByLabelText(akMT('serviceAccountModule.projectAccess')));

    await user.click(
      await screen.findByRole('option', {
        name: akMT('serviceAccountModule.forSpecificProjects'),
      })
    );

    await user.click(
      document.querySelector('[data-test-service-account-add-project-empty]') as HTMLElement
    );

    const picker = await waitFor(() => {
      const drawn = document.querySelector('[data-test-add-project-drawer]');

      expect(drawn).not.toBeNull();

      return drawn as HTMLElement;
    });

    await user.click(await within(picker).findByLabelText(PROJECT.package_name));
    await user.click(picker.querySelector('[data-test-add-project-confirm]') as HTMLElement);

    await save(user);

    await waitFor(() => expect(addedProjects).toStrictEqual([PROJECT.id]));
    expect(sent).toMatchObject({ all_projects: false });
  });

  it('shows the secret it was answered with, which is never sent again', async () => {
    const user = userEvent.setup();

    renderPage();

    await describeAccount(user);
    await save(user);

    expect(await screen.findByDisplayValue('shh')).toBeInTheDocument();

    expect(document.querySelector('[data-test-service-account-create-done]')).not.toBeNull();

    expect(document.querySelector('[data-test-service-account-create-save]')).toBeNull();
  });

  it('names the field the endpoint refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${ServiceAccountEndpoints.list()}`, () =>
        HttpResponse.json({ name: ['Already taken'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    renderPage();

    await describeAccount(user);
    await save(user);

    expect(await screen.findByText('name - Already taken')).toBeInTheDocument();
  });
});
