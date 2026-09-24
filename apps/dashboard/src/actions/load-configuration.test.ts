import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { configurationStore } from '@irene/api/stores/configuration';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';

import {
  buildFrontendConfiguration,
  buildServerConfiguration,
  buildSession,
} from '@tests/factories';

import { loadConfiguration, loadDashboardConfiguration } from '@/actions/load-configuration';
import { buildAPITestURL, server } from '@tests/server';

afterEach(() => {
  configurationStore.setState(configurationStore.getInitialState(), true);
  queryClient.clear();
  clearStoredSession();
});

describe('loadConfiguration', () => {
  it('stores the name from the frontend configuration response', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json(buildFrontendConfiguration({ name: 'Acme Security' }))
      )
    );

    await loadConfiguration(queryClient);

    expect(configurationStore.getState().name()).toBe('Acme Security');
  });

  it('stores the socket address from the server configuration response', async () => {
    const serverConfiguration = buildServerConfiguration();

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.server()), () =>
        HttpResponse.json(serverConfiguration)
      )
    );

    await loadConfiguration(queryClient);

    expect(configurationStore.getState().serverData).toEqual(serverConfiguration);
  });

  it('marks the frontend configuration fetched when the request fails', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      )
    );

    await loadConfiguration(queryClient);

    expect(configurationStore.getState().hasFetchedFrontend).toBe(true);
    expect(configurationStore.getState().name()).toBe('Appknox');
  });

  it('stores the frontend configuration when the server configuration request fails', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json(buildFrontendConfiguration({ name: 'Acme Security' }))
      ),
      http.get(buildAPITestURL(ConfigurationEndpoints.server()), () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      )
    );

    await loadConfiguration(queryClient);

    expect(configurationStore.getState().name()).toBe('Acme Security');
    expect(configurationStore.getState().hasFetchedServer).toBe(true);
  });
});

describe('loadDashboardConfiguration', () => {
  it('stores the hosts the dashboard configuration overrides', async () => {
    storeSession(buildSession());

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () =>
        HttpResponse.json({
          dashboard_url: 'https://secure.acme.test',
          devicefarm_url: 'https://device-farm.acme.test',
        })
      )
    );

    await loadDashboardConfiguration(queryClient);

    expect(configurationStore.getState().deviceFarmUrl()).toBe('https://device-farm.acme.test');
  });

  it('clears the stored hosts when the request fails', async () => {
    storeSession(buildSession());

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      )
    );

    await loadDashboardConfiguration(queryClient);

    expect(configurationStore.getState().deviceFarmUrl()).toBe('');
  });

  it('sends no dashboard configuration request when no session is stored', async () => {
    let requested = false;

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () => {
        requested = true;

        return HttpResponse.json({ dashboard_url: '', devicefarm_url: '' });
      })
    );

    await loadDashboardConfiguration(queryClient);

    expect(requested).toBe(false);
  });
});
