import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { IntegrationEndpoints } from '@irene/api/services/integration/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { GithubIntegration } from './components/github-integration';

const INTEGRATIONS_ADDRESS = '/dashboard/organization/settings/integrations';

const GITHUB_ACCOUNT = {
  avatar_url: 'https://github.com/avatar.png',
  created_on: '2026-01-01T00:00:00Z',
  html_url: 'https://github.com/octocat',
  login: 'octocat',
  name: 'The Octocat',
  updated_on: '2026-01-02T00:00:00Z',
};

/** Answers the GitHub connection with `account`, or with the status a failure carries. */
const withGithub = (account: typeof GITHUB_ACCOUNT | null, status?: number) =>
  server.use(
    http.get(`*/${IntegrationEndpoints.github('*')}`, () =>
      status === undefined ? HttpResponse.json(account) : new HttpResponse(null, { status })
    )
  );

/** Renders the tab with the toaster beside it, as the screen around it has one. */
const renderTab = () =>
  renderAtAddress(
    <Fragment>
      <GithubIntegration />

      <AkToaster />
    </Fragment>,
    INTEGRATIONS_ADDRESS
  );

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));
});

describe('GitHub', () => {
  it('offers the way to connect a service nothing is connected to', async () => {
    withGithub(null);

    renderTab();

    expect(await screen.findByText(akMT('github'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('connect'))).toBeInTheDocument();
    expect(screen.queryByText(akMT('integrated'))).not.toBeInTheDocument();
  });

  it('reads as connected, with the way to manage it, once an account is connected', async () => {
    withGithub(GITHUB_ACCOUNT);

    renderTab();

    expect(await screen.findByText(akMT('integrated'))).toBeInTheDocument();
    expect(screen.getByText(akMT('manage'))).toBeInTheDocument();
  });

  it('offers the connection again where the connected token no longer works', async () => {
    withGithub(null, HTTP_STATUS_CODES.BAD_REQUEST);

    renderTab();

    expect(await screen.findByText(akMT('connect'))).toBeInTheDocument();
  });

  it('asks the API where to send the account when a connection is made', async () => {
    const user = userEvent.setup();

    let askedFor: string | null = null;

    withGithub(null);

    server.use(
      http.get(`*/${IntegrationEndpoints.githubRedirect('*')}`, ({ request }) => {
        askedFor = new URL(request.url).pathname;

        return HttpResponse.json({ url: 'https://github.com/login/oauth/authorize?client_id=ak' });
      })
    );

    renderTab();

    await user.click(await screen.findByText(akMT('connect')));

    await waitFor(() => expect(askedFor).toContain('/github/redirect'));
  });

  it('says the connection failed where the consent screen cannot be asked for', async () => {
    const user = userEvent.setup();

    withGithub(null);

    server.use(
      http.get(
        `*/${IntegrationEndpoints.githubRedirect('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderTab();

    await user.click(await screen.findByText(akMT('connect')));

    expect(await screen.findByText(akMT('githubErrorIntegration'))).toBeInTheDocument();
  });

  it('shows the connected account in the panel, with the way to disconnect it', async () => {
    const user = userEvent.setup();

    withGithub(GITHUB_ACCOUNT);

    renderTab();

    await user.click(await screen.findByText(akMT('manage')));

    expect(await screen.findByText(akMT('githubIntegration'))).toBeInTheDocument();
    expect(screen.getByText(GITHUB_ACCOUNT.login)).toBeInTheDocument();
    expect(screen.getByText('https://github.com')).toBeInTheDocument();
    expect(screen.getByText(akMT('disconnect'))).toBeInTheDocument();
  });

  it('asks before revoking, and reads as unconnected once it is revoked', async () => {
    const user = userEvent.setup();

    let account: typeof GITHUB_ACCOUNT | null = GITHUB_ACCOUNT;

    server.use(
      http.get(`*/${IntegrationEndpoints.github('*')}`, () => HttpResponse.json(account)),

      http.delete(`*/${IntegrationEndpoints.github('*')}`, () => {
        account = null;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    renderTab();

    await user.click(await screen.findByText(akMT('manage')));
    await user.click(await screen.findByText(akMT('disconnect')));

    expect(await screen.findByText(akMT('confirmBox.revokeGithub'))).toBeInTheDocument();

    await user.click(screen.getByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('githubWillBeRevoked'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('connect'))).toBeInTheDocument();
  });

  it('keeps the connection where the question is answered with cancel', async () => {
    const user = userEvent.setup();

    withGithub(GITHUB_ACCOUNT);

    renderTab();

    await user.click(await screen.findByText(akMT('manage')));
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('cancel')));

    expect(await screen.findByText(GITHUB_ACCOUNT.login)).toBeInTheDocument();
  });
});

describe('GitHub, when revoking is refused', () => {
  it('says what the endpoint gave as the reason', async () => {
    const user = userEvent.setup();

    withGithub(GITHUB_ACCOUNT);

    server.use(
      http.delete(`*/${IntegrationEndpoints.github('*')}`, () =>
        HttpResponse.json(
          { detail: 'Revoked elsewhere already' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    renderTab();

    await user.click(await screen.findByText(akMT('manage')));
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText('Revoked elsewhere already')).toBeInTheDocument();
  });
});
