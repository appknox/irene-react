import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { configurationStore } from '@irene/api/stores/configuration';

import { loadConfiguration } from '@/actions/load-configuration';
import { buildFrontendConfiguration, buildServerConfiguration } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

afterEach(() => {
  configurationStore.setState(configurationStore.getInitialState(), true);
  queryClient.clear();
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

  it('stores the frontend configuration when the server one fails', async () => {
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
