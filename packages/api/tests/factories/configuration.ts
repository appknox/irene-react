import { faker } from '@faker-js/faker';

import type {
  ApiDashboardConfig,
  ApiFrontendConfiguration,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

/**
 * How a deployment describes itself, saying nothing of its own.
 *
 * Branding, theme and registration are empty because that is the response an
 * unbranded install sends, and what makes the readers fall back to the Appknox
 * values. A test about branding passes its own.
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
  registration_enabled: false,
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
 * Where a SaaS install keeps its services.
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

export const buildDashboardConfig = (
  overrides: Partial<ApiDashboardConfig> = {}
): ApiDashboardConfig => ({
  dashboard_url: faker.internet.url(),
  devicefarm_url: faker.internet.url(),
  ...overrides,
});
