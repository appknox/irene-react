import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { UserEndpoints } from '@irene/api/services/user/endpoints';
import { VulnerabilityEndpoints } from '@irene/api/services/vulnerability/endpoints';
import { configurationStore } from '@irene/api/stores/configuration';
import { organizationStore } from '@irene/api/stores/organization';
import { vulnerabilityStore } from '@irene/api/stores/vulnerability';
import { getLocale, setLocale } from '@irene/translations/intl';
import { getStoredLocale } from '@irene/translations/locale';

import {
  buildDashboardConfig,
  buildOrganization,
  buildOrganizationMe,
  buildUserResponse,
  buildVulnerability,
  buildVulnerabilityListResponse,
} from '@tests/factories';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { buildAPITestURL, server } from '@tests/server';

const USER_ID = 42;

/** Answers the organizations list with exactly these organizations. */
const organizationsAre = (...organizations: ReturnType<typeof buildOrganization>[]) => {
  server.use(
    http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
      HttpResponse.json({
        count: organizations.length,
        next: null,
        previous: null,
        results: organizations,
      })
    )
  );
};

afterEach(() => {
  organizationStore.getState().clear();
  vulnerabilityStore.getState().clear();
  configurationStore.setState(configurationStore.getInitialState(), true);
  queryClient.clear();
});

describe('setupUserAndOrgContext', () => {
  it('selects the first organization the account belongs to', async () => {
    const first = buildOrganization();

    organizationsAre(first, buildOrganization());

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().selected).toEqual(first);
  });

  it('stores the account permissions returned by the organization me endpoint', async () => {
    const me = buildOrganizationMe({ has_security_permission: true });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me('*')), () => HttpResponse.json(me))
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().me).toEqual(me);
  });

  it('resolves when the StoreKnox organization request fails', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      )
    );

    await expect(setupUserAndOrgContext(queryClient, USER_ID)).resolves.toMatchObject({
      id: expect.any(Number),
    });
  });

  it('sets the locale to the language the account carries', async () => {
    server.use(
      http.get(buildAPITestURL(UserEndpoints.detail(USER_ID)), () =>
        HttpResponse.json(buildUserResponse({ lang: 'ja' }))
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(getLocale()).toBe('ja');
  });

  it('leaves the organization unselected when the account belongs to none', async () => {
    organizationsAre();

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().selected).toBeNull();
  });

  it('requests the organizations, dashboard configuration, vulnerabilities, membership and account', async () => {
    const organization = buildOrganization();
    const asked: string[] = [];

    const record = ({ request }: { request: Request }) => {
      asked.push(new URL(request.url).pathname);
    };

    server.events.on('request:start', record);
    organizationsAre(organization);

    await setupUserAndOrgContext(queryClient, USER_ID);

    server.events.removeListener('request:start', record);

    expect(asked).toEqual(
      expect.arrayContaining([
        `/${OrganizationEndpoints.list()}`,
        `/${OrganizationEndpoints.me(organization.id)}`,
        `/${OrganizationEndpoints.member(organization.id, USER_ID)}`,
        `/${ConfigurationEndpoints.dashboard()}`,
        `/${VulnerabilityEndpoints.list()}`,
        `/${UserEndpoints.detail(USER_ID)}`,
      ])
    );
  });

  it('stores the hosts from the dashboard configuration', async () => {
    const hosts = buildDashboardConfig();

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () => HttpResponse.json(hosts))
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(configurationStore.getState().dashboardUrl()).toBe(hosts.dashboard_url);
    expect(configurationStore.getState().deviceFarmUrl()).toBe(hosts.devicefarm_url);
  });

  it('stores the vulnerability catalogue', async () => {
    const vulnerability = buildVulnerability({ name: 'Insecure storage' });

    server.use(
      http.get(buildAPITestURL(VulnerabilityEndpoints.list()), () =>
        HttpResponse.json(buildVulnerabilityListResponse([vulnerability]))
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(vulnerabilityStore.getState().all).toEqual([vulnerability]);
    expect(vulnerabilityStore.getState().find(vulnerability.id)).toEqual(vulnerability);
  });

  it("writes the account's language to localStorage", async () => {
    server.use(
      http.get(buildAPITestURL(UserEndpoints.detail(USER_ID)), () =>
        HttpResponse.json(buildUserResponse({ lang: 'ja' }))
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(getStoredLocale()).toBe('ja');
  });

  it('leaves the locale unchanged when the account language is not supported', async () => {
    await setLocale('ja');

    server.use(
      http.get(buildAPITestURL(UserEndpoints.detail(USER_ID)), () =>
        HttpResponse.json({
          data: {
            id: USER_ID,
            type: 'users',
            attributes: { ...buildUserResponse().data.attributes, lang: 'kl' },
          },
        })
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(getLocale()).toBe('ja');
  });
});
