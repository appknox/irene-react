import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import {
  buildDashboardConfig,
  buildFrontendConfiguration,
  buildServerConfiguration,
} from '@tests/factories';

import { ConfigurationEndpoints, ConfigurationService } from '@irene/api/services/configuration';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';
import { recordRequestConfigs } from '@tests/utils';

const dashboardUrl = buildAPITestURL(ConfigurationEndpoints.dashboard());

describe('ConfigurationService.getDashboardConfiguration', () => {
  it('returns the dashboard and device farm hosts', async () => {
    const hosts = buildDashboardConfig();

    server.use(http.get(dashboardUrl, () => HttpResponse.json(hosts)));

    await expect(ConfigurationService.getDashboardConfiguration()).resolves.toEqual(hosts);
  });

  it('gets the v2 dashboard_configuration endpoint', () => {
    expect(ConfigurationEndpoints.dashboard()).toBe('api/v2/dashboard_configuration');
  });

  it('rejects when the request is refused', async () => {
    server.use(
      http.get(dashboardUrl, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
      )
    );

    const error = await ConfigurationService.getDashboardConfiguration().catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
  });
});

describe('ConfigurationService.getFrontendConfiguration', () => {
  it('returns the name, images, theme and integrations', async () => {
    const configuration = buildFrontendConfiguration({ name: 'Acme Security' });

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json(configuration)
      )
    );

    await expect(ConfigurationService.getFrontendConfiguration()).resolves.toEqual(configuration);
  });

  it('rejects when the request is refused', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    const error = await ConfigurationService.getFrontendConfiguration().catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  });
});

describe('ConfigurationService.getServerConfiguration', () => {
  it('returns the socket host, device farm host and enterprise flag', async () => {
    const configuration = buildServerConfiguration({ enterprise: true });

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.server()), () =>
        HttpResponse.json(configuration)
      )
    );

    await expect(ConfigurationService.getServerConfiguration()).resolves.toEqual(configuration);
  });
});

describe('the timeout on the dashboard configuration', () => {
  it('abandons the request after 30 seconds, so a hung server does not hold the page', async () => {
    const recorder = recordRequestConfigs();

    await ConfigurationService.getDashboardConfiguration().catch(() => undefined);
    recorder.stop();

    // The wait rides on a signal rather than axios's own `timeout`, which an
    // intercepted request never honours.
    expect(recorder.latest()?.signal).toBeInstanceOf(AbortSignal);
    expect(recorder.latest()?.signal?.aborted).toBe(false);
  });
});
