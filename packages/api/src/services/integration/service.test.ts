import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { IntegrationEndpoints, IntegrationService } from '@irene/api/services/integration';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';

const ORGANIZATION_ID = 42;

const GITHUB_ACCOUNT = {
  avatar_url: 'https://github.com/avatar.png',
  created_on: '2026-01-01T00:00:00Z',
  html_url: 'https://github.com/octocat',
  login: 'octocat',
  name: 'The Octocat',
  updated_on: '2026-01-02T00:00:00Z',
};

describe('IntegrationService.getGithubIntegration', () => {
  it('returns the connected account', async () => {
    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.github(ORGANIZATION_ID)), () =>
        HttpResponse.json(GITHUB_ACCOUNT)
      )
    );

    await expect(IntegrationService.getGithubIntegration(ORGANIZATION_ID)).resolves.toStrictEqual({
      integratedUser: GITHUB_ACCOUNT,
      reconnect: false,
    });
  });

  it('reads an empty body as no connection rather than as one without a login', async () => {
    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.github(ORGANIZATION_ID)), () =>
        HttpResponse.json(null)
      )
    );

    await expect(IntegrationService.getGithubIntegration(ORGANIZATION_ID)).resolves.toStrictEqual({
      integratedUser: null,
      reconnect: false,
    });
  });

  it('reads a refused request as a connection to make again', async () => {
    server.use(
      http.get(
        buildAPITestURL(IntegrationEndpoints.github(ORGANIZATION_ID)),
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await expect(IntegrationService.getGithubIntegration(ORGANIZATION_ID)).resolves.toStrictEqual({
      integratedUser: null,
      reconnect: true,
    });
  });

  it('throws any other failure, which is not a connection to make again', async () => {
    server.use(
      http.get(
        buildAPITestURL(IntegrationEndpoints.github(ORGANIZATION_ID)),
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await expect(
      IntegrationService.getGithubIntegration(ORGANIZATION_ID).catch(getApiErrorStatus)
    ).resolves.toBe(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  });
});

describe('IntegrationService.getGithubRedirectUrl', () => {
  it('returns the URL the consent screen is asked for at', async () => {
    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.githubRedirect(ORGANIZATION_ID)), () =>
        HttpResponse.json({ url: 'https://github.com/login/oauth/authorize' })
      )
    );

    await expect(IntegrationService.getGithubRedirectUrl(ORGANIZATION_ID)).resolves.toBe(
      'https://github.com/login/oauth/authorize'
    );
  });
});

describe('IntegrationService.revokeGithubIntegration', () => {
  it('revokes the connection', async () => {
    let revoked = false;

    server.use(
      http.delete(buildAPITestURL(IntegrationEndpoints.github(ORGANIZATION_ID)), () => {
        revoked = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await IntegrationService.revokeGithubIntegration(ORGANIZATION_ID);

    expect(revoked).toBe(true);
  });
});

describe('reading a connection the endpoint answers with a 404', () => {
  const reads = [
    ['jira', IntegrationEndpoints.jira, IntegrationService.getJiraIntegration],
    ['serviceNow', IntegrationEndpoints.serviceNow, IntegrationService.getServiceNowIntegration],
    ['slack', IntegrationEndpoints.slack, IntegrationService.getSlackIntegration],
    ['splunk', IntegrationEndpoints.splunk, IntegrationService.getSplunkIntegration],
  ] as const;

  it.each(reads)(
    'reports %s as nothing connected rather than as a failure',
    async (_name, endpoint, read) => {
      server.use(
        http.get(
          buildAPITestURL(endpoint(ORGANIZATION_ID)),
          () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
        )
      );

      await expect(read(ORGANIZATION_ID)).resolves.toBeNull();
    }
  );

  it.each(reads)('throws any other failure reading %s', async (_name, endpoint, read) => {
    server.use(
      http.get(
        buildAPITestURL(endpoint(ORGANIZATION_ID)),
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await expect(read(ORGANIZATION_ID).catch(getApiErrorStatus)).resolves.toBe(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  });
});

describe('IntegrationService.getSplunkIndexes', () => {
  it("leaves out Splunk's own internal indexes and reverses the rest", async () => {
    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.splunkIndexes(ORGANIZATION_ID)), () =>
        HttpResponse.json({ indexes: ['_internal', 'main', 'security', '_audit'] })
      )
    );

    await expect(IntegrationService.getSplunkIndexes(ORGANIZATION_ID)).resolves.toStrictEqual([
      'security',
      'main',
    ]);
  });
});

describe('IntegrationService.generateJiraSecuritySecret', () => {
  it('returns the secret the endpoint mints', async () => {
    server.use(
      http.post(buildAPITestURL(IntegrationEndpoints.jiraSecurity(ORGANIZATION_ID)), () =>
        HttpResponse.json({ secret: 'sh-ar-ed' })
      )
    );

    await expect(IntegrationService.generateJiraSecuritySecret(ORGANIZATION_ID)).resolves.toBe(
      'sh-ar-ed'
    );
  });
});

describe('IntegrationService.setJiraSecurityAutoPush', () => {
  it('sends whether findings are pushed as they change', async () => {
    let sent: unknown = null;

    server.use(
      http.patch(
        buildAPITestURL(IntegrationEndpoints.jiraSecurity(ORGANIZATION_ID)),
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json({ auto_push: true });
        }
      )
    );

    await IntegrationService.setJiraSecurityAutoPush(ORGANIZATION_ID, true);

    expect(sent).toStrictEqual({ auto_push: true });
  });
});

describe('IntegrationService.setSlackChannel', () => {
  it('sends the channel under the name the endpoint expects', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(IntegrationEndpoints.slack(ORGANIZATION_ID)),
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json({ channel_id: 'C123', api_token: 'tok' });
        }
      )
    );

    await IntegrationService.setSlackChannel(ORGANIZATION_ID, 'C123');

    expect(sent).toStrictEqual({ channel_id: 'C123' });
  });
});

describe('revoking a connection', () => {
  it.each([
    ['jira', IntegrationEndpoints.jira, IntegrationService.revokeJiraIntegration],
    ['jiraSecurity', IntegrationEndpoints.jiraSecurity, IntegrationService.revokeJiraSecurity],
    ['serviceNow', IntegrationEndpoints.serviceNow, IntegrationService.revokeServiceNowIntegration],
    ['slack', IntegrationEndpoints.slack, IntegrationService.revokeSlackIntegration],
    ['splunk', IntegrationEndpoints.splunk, IntegrationService.revokeSplunkIntegration],
  ] as const)('takes the %s connection down', async (_name, endpoint, revoke) => {
    let revoked = false;

    server.use(
      http.delete(buildAPITestURL(endpoint(ORGANIZATION_ID)), () => {
        revoked = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await revoke(ORGANIZATION_ID);

    expect(revoked).toBe(true);
  });
});

describe('IntegrationService.getJiraSecurity', () => {
  it('returns how far the connection has got', async () => {
    const state = {
      status: 'awaiting_jira',
      connected_on: null,
      configure_path: '/configure',
      auto_push: false,
    };

    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.jiraSecurity(ORGANIZATION_ID)), () =>
        HttpResponse.json(state)
      )
    );

    await expect(IntegrationService.getJiraSecurity(ORGANIZATION_ID)).resolves.toStrictEqual(state);
  });
});

describe('writing a connection', () => {
  it('sends the Jira host, account and whether it is a data centre', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(IntegrationEndpoints.jira(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(body);
        }
      )
    );

    const details = {
      host: 'https://acme.atlassian.net',
      username: 'ali',
      password: 'key',
      is_data_center: false,
    };

    await IntegrationService.setJiraIntegration(ORGANIZATION_ID, details);

    expect(sent).toStrictEqual(details);
  });

  it('sends the ServiceNow instance, account and table', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(IntegrationEndpoints.serviceNow(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(body);
        }
      )
    );

    const details = {
      instance_url: 'https://acme.service-now.com',
      username: 'ali',
      password: 'secret',
      table_name: 1,
    };

    await IntegrationService.setServiceNowIntegration(ORGANIZATION_ID, details);

    expect(sent).toStrictEqual(details);
  });

  it('sends the Splunk instance, its tokens and what it writes where', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(IntegrationEndpoints.splunk(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(body);
        }
      )
    );

    const details = {
      instance_url: 'https://splunk.acme.test',
      hec_token: 'hec',
      api_token: 'api',
      vulnerability_index: 'findings',
      send_user_logs: true,
      user_logs_index: 'logs',
      log_frequency_hours: 48,
    };

    await IntegrationService.setSplunkIntegration(ORGANIZATION_ID, details);

    expect(sent).toStrictEqual(details);
  });
});

describe('IntegrationService.getSlackRedirectUrl', () => {
  it('returns the URL the consent screen is asked for at', async () => {
    server.use(
      http.get(buildAPITestURL(IntegrationEndpoints.slackRedirect(ORGANIZATION_ID)), () =>
        HttpResponse.json({ url: 'https://slack.com/oauth/v2/authorize' })
      )
    );

    await expect(IntegrationService.getSlackRedirectUrl(ORGANIZATION_ID)).resolves.toBe(
      'https://slack.com/oauth/v2/authorize'
    );
  });
});
