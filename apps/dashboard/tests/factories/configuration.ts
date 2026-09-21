import { faker } from '@faker-js/faker';

import type {
  ApiFrontendConfiguration,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

/**
 * How a deployment describes itself.
 *
 * The branding, theme and registration link are left empty rather than faked:
 * an empty value is what makes the app fall back to the Appknox defaults, which
 * is the install most tests are written against. A test about branding passes
 * its own.
 *
 * @param overrides - What this test cares about.
 * @returns A frontend configuration response.
 */
export const buildFrontendConfiguration = (
  overrides: Partial<ApiFrontendConfiguration> = {}
): ApiFrontendConfiguration => ({
  name: '',
  url: '',
  hide_poweredby_logo: false,
  registration_enabled: true,
  registration_link: '',
  images: { favicon: '', logo_on_darkbg: '', logo_on_lightbg: '' },
  theme: {
    scheme: '',
    primary_color: '',
    primary_alt_color: '',
    secondary_color: '',
    secondary_alt_color: '',
  },
  integrations: {
    pendo_key: faker.string.alphanumeric(32),
    freshchat_key: faker.string.alphanumeric(32),
    freshdesk_configuration: { widget_id: faker.string.numeric(14) },
  },
  ...overrides,
});

/**
 * How the install itself is deployed. A SaaS install by default, since that is
 * the one every upsell and plan prompt is written for.
 *
 * @param overrides - What this test cares about.
 * @returns A server configuration response.
 */
export const buildServerConfiguration = (
  overrides: Partial<ApiServerConfiguration> = {}
): ApiServerConfiguration => ({
  websocket: `wss://${faker.internet.domainName()}`,
  devicefarm_url: faker.internet.url(),
  enterprise: false,
  ...overrides,
});
