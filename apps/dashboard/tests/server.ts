import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { FreshdeskEndpoints } from '@irene/api/services/freshdesk/endpoints';
import { NotificationEndpoints } from '@irene/api/services/notification/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { UserEndpoints } from '@irene/api/services/user/endpoints';
import { VulnerabilityEndpoints } from '@irene/api/services/vulnerability/endpoints';
import { getConfigValue } from '@irene/config';

import {
  buildDashboardConfig,
  buildFrontendConfiguration,
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationMembership,
  buildOrganizationNamespace,
  buildServerConfiguration,
  buildUserResponse,
  buildVulnerabilityListResponse,
} from '@tests/factories';

/**
 * The host the client resolves to, rather than a copy of the fallback. Read on
 * call: this module loads from the setup file, before the config tiers exist.
 */
export const apiHost = () => getConfigValue('IRENE_API_HOST');

/** Builds the URL a handler intercepts, from the host and a path. */
export const buildAPITestURL = (path: string) => `${apiHost()}/${path}`;

/**
 * Intercepts at the network boundary, so tests exercise the real axios stack —
 * interceptors, serialisation and status handling included.
 *
 * Both configurations are answered by default because every page load asks for
 * them before the first render, and the session check because every signed-in
 * page confirms its token on the way in. A test that cares about any of the
 * three overrides it like any other handler.
 */
export const server = setupServer(
  http.get(`*/${ConfigurationEndpoints.frontend()}`, () =>
    HttpResponse.json(buildFrontendConfiguration())
  ),
  http.get(`*/${ConfigurationEndpoints.server()}`, () =>
    HttpResponse.json(buildServerConfiguration())
  ),
  http.get(`*/${ConfigurationEndpoints.dashboard()}`, () =>
    HttpResponse.json(buildDashboardConfig())
  ),
  http.post(`*/${AuthEndpoints.check()}`, () => HttpResponse.json({})),

  /*
    The signed-in pages load an organization and an account on the way in, so
    every one of them is answered by default. StoreKnox is not: most
    deployments do not have it, and the loader is written to carry on.
  */
  http.get(`*/${OrganizationEndpoints.list()}`, () =>
    HttpResponse.json({ count: 1, next: null, previous: null, results: [buildOrganization()] })
  ),
  http.get(`*/${OrganizationEndpoints.me('*')}`, () => HttpResponse.json(buildOrganizationMe())),
  http.get(`*/${OrganizationEndpoints.member('*', '*')}`, () =>
    HttpResponse.json(buildOrganizationMembership())
  ),
  http.get(`*/${VulnerabilityEndpoints.list()}`, () =>
    HttpResponse.json(buildVulnerabilityListResponse())
  ),

  /* An account in no StoreKnox organization, which the list reports as empty. */
  http.get(`*/${OrganizationEndpoints.storeknoxOrganization()}`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  ),
  http.get(`*/${UserEndpoints.detail('*')}`, () => HttpResponse.json(buildUserResponse())),

  /* The namespace-request notifications read the namespace to state where it stands. */
  http.get(`*/${OrganizationEndpoints.namespace('*', '*')}`, () =>
    HttpResponse.json(buildOrganizationNamespace())
  ),

  /* The bar's bell asks for the unread count on every signed-in page, for whichever product it is on. */
  http.get(`*/${NotificationEndpoints.list('appknox')}`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  ),

  http.get(`*/${NotificationEndpoints.list('storeknox')}`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  ),

  /* Every signed-in page installs the support widget, which signs in on load. */
  http.post(`*/${FreshdeskEndpoints.authenticate()}`, () =>
    HttpResponse.json({ token: 'a-widget-token', name: 'ada', email: 'ada@appknox.com' })
  )
);
