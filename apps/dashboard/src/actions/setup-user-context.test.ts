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

describe('what the signed-in pages are given', () => {
  it('works in the first organization the account belongs to', async () => {
    const first = buildOrganization();

    organizationsAre(first, buildOrganization());

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().selected).toEqual(first);
  });

  it('records what the account may do there, which gates the dashboard', async () => {
    const me = buildOrganizationMe({ has_security_permission: true });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me('*')), () => HttpResponse.json(me))
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().me).toEqual(me);
  });

  it('carries on when the deployment has no StoreKnox organization', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      )
    );

    await expect(setupUserAndOrgContext(queryClient, USER_ID)).resolves.toMatchObject({
      id: expect.any(Number),
    });
  });

  it('renders the interface in the language the account reads', async () => {
    server.use(
      http.get(buildAPITestURL(UserEndpoints.detail(USER_ID)), () =>
        HttpResponse.json(buildUserResponse({ lang: 'ja' }))
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(getLocale()).toBe('ja');
  });

  it('leaves an account with no organization unselected rather than failing', async () => {
    organizationsAre();

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(organizationStore.getState().selected).toBeNull();
  });

  it('asks for everything a signed-in page needs, the membership included', async () => {
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

  it('holds the hosts this organization links out to, for the pages that open them', async () => {
    const hosts = buildDashboardConfig();

    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.dashboard()), () => HttpResponse.json(hosts))
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(configurationStore.getState().dashboardUrl()).toBe(hosts.dashboard_url);
    expect(configurationStore.getState().deviceFarmUrl()).toBe(hosts.devicefarm_url);
  });

  it('loads the catalogue every finding is described by', async () => {
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

  it("stores the account's language, so the next signed-out page opens in it", async () => {
    server.use(
      http.get(buildAPITestURL(UserEndpoints.detail(USER_ID)), () =>
        HttpResponse.json(buildUserResponse({ lang: 'ja' }))
      )
    );

    await setupUserAndOrgContext(queryClient, USER_ID);

    expect(getStoredLocale()).toBe('ja');
  });

  it('leaves the locale alone for an account whose language is not supported', async () => {
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
