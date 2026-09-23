import { focusManager } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { DeviceFarmEndpoints } from '@irene/api/services/device-farm/endpoints';
import { StatusEndpoints } from '@irene/api/services/system-status/endpoints';
import { configurationStore } from '@irene/api/stores/configuration';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildDashboardConfig, buildServerConfiguration, buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { apiHost, buildAPITestURL, server } from '@tests/server';

const DEVICE_FARM = 'https://devicefarm.example.test';
const STORAGE_URL = 'https://storage.example.test/bucket/probe-object';

const statusUrl = buildAPITestURL(StatusEndpoints.status());
const pingUrl = buildAPITestURL(StatusEndpoints.ping());

/** Answers the storage probe, and the pre-signed URL it hands back. */
const setStorageReach = ({ reachable }: { reachable: boolean }) => {
  server.use(
    http.get(statusUrl, () => HttpResponse.json({ data: { storage: STORAGE_URL } })),

    http.get(STORAGE_URL, () =>
      reachable
        ? new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
        : HttpResponse.error()
    )
  );
};

const setApiReach = ({ reachable }: { reachable: boolean }) => {
  server.use(
    http.get(pingUrl, () =>
      reachable ? HttpResponse.json({ ping: 'pong' }) : HttpResponse.error()
    )
  );
};

const setDeviceFarmReach = ({ reachable }: { reachable: boolean }) => {
  server.use(
    http.get(`${DEVICE_FARM}${DeviceFarmEndpoints.ping()}`, () =>
      reachable ? HttpResponse.json({ ping: 'pong' }) : HttpResponse.error()
    )
  );
};

/** Every system reachable, which each test then varies. */
function everySystemIsUp() {
  setStorageReach({ reachable: true });
  setApiReach({ reachable: true });
  setDeviceFarmReach({ reachable: true });
}

const rowFor = (system: string) =>
  screen.getByText(system).closest('tr') ?? document.createElement('tr');

const openStatus = () => renderAtRoute('/dashboard/status');

/** The deployment's own device farm, which the server configuration names. */
const deploymentDeviceFarmIs = (url: string) => {
  server.use(
    http.get(buildAPITestURL(ConfigurationEndpoints.server()), () =>
      HttpResponse.json(buildServerConfiguration({ devicefarm_url: url }))
    )
  );
};

/** The organization's own device farm, which overrides the deployment's. */
const organizationDeviceFarmIs = (url: string) => {
  server.use(
    http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () =>
      HttpResponse.json(buildDashboardConfig({ devicefarm_url: url }))
    )
  );
};

/* Every group starts signed out, on the deployment's own device farm. */
beforeEach(() => {
  clearStoredSession();
  deploymentDeviceFarmIs(DEVICE_FARM);
});

describe('SystemStatusPage', () => {
  it('names every system it reports on', async () => {
    everySystemIsUp();

    await openStatus();

    expect(await screen.findByRole('heading', { name: akMT('systemStatus') })).toBeInTheDocument();
    expect(screen.getByText(akMT('storage'))).toBeInTheDocument();
    expect(screen.getByText(akMT('devicefarm'))).toBeInTheDocument();
    expect(screen.getByText(`${akMT('api')} ${akMT('server')}`)).toBeInTheDocument();
  });

  it('reports a system that answered as operational', async () => {
    everySystemIsUp();

    await openStatus();

    await waitFor(() =>
      expect(rowFor(`${akMT('api')} ${akMT('server')}`)).toHaveTextContent(akMT('operational'))
    );
  });

  it('counts a 404 from the object store as reachable, since the object never exists', async () => {
    everySystemIsUp();

    await openStatus();

    await waitFor(() => expect(rowFor(akMT('storage'))).toHaveTextContent(akMT('operational')));
  });

  it('reports a system that never answered as unreachable', async () => {
    everySystemIsUp();
    setDeviceFarmReach({ reachable: false });

    await openStatus();

    await waitFor(() => expect(rowFor(akMT('devicefarm'))).toHaveTextContent(akMT('unreachable')));
  });

  it('suggests the proxy when the object store is the system that failed', async () => {
    everySystemIsUp();
    setStorageReach({ reachable: false });

    await openStatus();

    await waitFor(() => expect(rowFor(akMT('storage'))).toHaveTextContent(akMT('proxyWarning')));
  });

  it('leaves the other systems answering when one is down', async () => {
    everySystemIsUp();
    setApiReach({ reachable: false });

    await openStatus();

    await waitFor(() =>
      expect(rowFor(`${akMT('api')} ${akMT('server')}`)).toHaveTextContent(akMT('unreachable'))
    );

    expect(rowFor(akMT('storage'))).toHaveTextContent(akMT('operational'));
  });

  it('is reachable signed out, since signing in may be what is broken', async () => {
    everySystemIsUp();

    const { router } = await openStatus();

    expect(router.state.location.pathname).toBe('/dashboard/status');
  });

  it('keeps the address the page used to live at working', async () => {
    everySystemIsUp();

    const { router } = await renderAtRoute('/status');

    expect(router.state.location.pathname).toBe('/dashboard/status');
  });
});

describe('the table the page is built from', () => {
  it('names itself for a screen reader, which reads a caption before the rows', async () => {
    everySystemIsUp();

    await openStatus();

    expect(await screen.findByRole('table', { name: akMT('systemStatus') })).toBeInTheDocument();
  });

  it('heads the columns the rows are read against', async () => {
    everySystemIsUp();

    await openStatus();

    expect(await screen.findByRole('columnheader', { name: akMT('system') })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: akMT('status') })).toBeInTheDocument();
  });

  it('renders one row per system, plus the header', async () => {
    everySystemIsUp();

    await openStatus();

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(4));
  });
});

describe('where the device farm is checked', () => {
  it('reads the host from the deployment configuration when signed out', async () => {
    everySystemIsUp();

    await openStatus();

    await waitFor(() => expect(rowFor(akMT('devicefarm'))).toHaveTextContent(akMT('operational')));
  });

  it("prefers the organization's own host when there is a session to read it with", async () => {
    const ORGANIZATION_DEVICE_FARM = 'https://devicefarm.acme.example.test';

    storeSession(buildSession());
    everySystemIsUp();
    organizationDeviceFarmIs(ORGANIZATION_DEVICE_FARM);

    server.use(
      http.get(`${ORGANIZATION_DEVICE_FARM}${DeviceFarmEndpoints.ping()}`, () =>
        HttpResponse.json({ ping: 'pong' })
      ),

      /* The deployment's own is left unreachable, so only the override can pass. */
      http.get(`${DEVICE_FARM}${DeviceFarmEndpoints.ping()}`, () => HttpResponse.error())
    );

    await openStatus();

    await waitFor(() =>
      expect(configurationStore.getState().deviceFarmUrl()).toBe(ORGANIZATION_DEVICE_FARM)
    );

    await waitFor(() => expect(rowFor(akMT('devicefarm'))).toHaveTextContent(akMT('operational')));
  });
});

describe('checking again when the window is focused', () => {
  /** Leaves and returns to the tab, which is what a refocus is to the query cache. */
  const refocusTheWindow = async () => {
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
  };

  it('asks every system again', async () => {
    let apiChecks = 0;

    everySystemIsUp();

    server.use(
      http.get(pingUrl, () => {
        apiChecks += 1;

        return HttpResponse.json({ ping: 'pong' });
      })
    );

    await openStatus();

    await waitFor(() => expect(apiChecks).toBe(1));

    await refocusTheWindow();

    await waitFor(() => expect(apiChecks).toBe(2));
  });

  it('shows what is true now, not what was true when the page opened', async () => {
    everySystemIsUp();

    await openStatus();

    await waitFor(() =>
      expect(rowFor(`${akMT('api')} ${akMT('server')}`)).toHaveTextContent(akMT('operational'))
    );

    setApiReach({ reachable: false });
    await refocusTheWindow();

    await waitFor(() =>
      expect(rowFor(`${akMT('api')} ${akMT('server')}`)).toHaveTextContent(akMT('unreachable'))
    );
  });
});

describe('a deployment that names no device farm', () => {
  it('falls back to the API host, which is where it runs when none is named', async () => {
    everySystemIsUp();
    deploymentDeviceFarmIs('');

    server.use(
      http.get(`${apiHost()}${DeviceFarmEndpoints.ping()}`, () =>
        HttpResponse.json({ ping: 'pong' })
      )
    );

    await openStatus();

    await waitFor(() => expect(rowFor(akMT('devicefarm'))).toHaveTextContent(akMT('operational')));
  });
});

describe('what counts as the API answering', () => {
  it('takes any answer, since the endpoint being reachable is the question', async () => {
    everySystemIsUp();
    server.use(http.get(pingUrl, () => HttpResponse.json({ status: 'ok' })));

    await openStatus();

    await waitFor(() =>
      expect(rowFor(`${akMT('api')} ${akMT('server')}`)).toHaveTextContent(akMT('operational'))
    );
  });
});
