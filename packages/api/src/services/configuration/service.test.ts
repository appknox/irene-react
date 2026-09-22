import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { ConfigurationEndpoints, ConfigurationService } from '@irene/api/services/configuration';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildDashboardConfig } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const dashboardUrl = buildAPITestURL(ConfigurationEndpoints.dashboard());

describe('ConfigurationService.getDashboardConfiguration', () => {
  it('returns the hosts this organization links out to', async () => {
    const hosts = buildDashboardConfig();

    server.use(http.get(dashboardUrl, () => HttpResponse.json(hosts)));

    await expect(ConfigurationService.getDashboardConfiguration()).resolves.toEqual(hosts);
  });

  it('asks the endpoint that answers per organization', () => {
    expect(ConfigurationEndpoints.dashboard()).toBe('api/v2/dashboard_configuration');
  });

  it('propagates a refusal, since it answers only for a signed-in account', async () => {
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
