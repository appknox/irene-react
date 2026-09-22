import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildDashboardConfig,
  buildFrontendConfiguration,
  buildServerConfiguration,
} from '@tests/factories';

import { configurationStore, WHITELABEL_THEMES } from '@irene/api/stores/configuration';

const BUILD_API_HOST = 'https://api.appknox.test';

const configuration = () => configurationStore.getState();

describe('what this install told the app about itself', () => {
  beforeEach(() => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: BUILD_API_HOST };
  });

  afterEach(() => {
    configurationStore.setState(configurationStore.getInitialState(), true);
  });

  describe('how the deployment presents itself', () => {
    it('takes the name, favicon and logo it named', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          name: 'Securely',
          images: {
            favicon: '/brand/icon.png',
            logo_on_darkbg: '/brand/dark.png',
            logo_on_lightbg: '/brand/light.png',
          },
        })
      );

      expect(configuration().name()).toBe('Securely');
      expect(configuration().favicon()).toBe('/brand/icon.png');
      expect(configuration().logo()).toBe('/brand/dark.png');
    });

    it('renders dark for any scheme but an explicit light one', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          theme: { ...buildFrontendConfiguration().theme, scheme: 'something-else' },
        })
      );

      expect(configuration().theme()).toBe(WHITELABEL_THEMES.dark);
    });

    it('takes the light logo when the deployment asks for light', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          theme: { ...buildFrontendConfiguration().theme, scheme: 'light' },
          images: { favicon: '', logo_on_darkbg: '/dark.png', logo_on_lightbg: '/light.png' },
        })
      );

      expect(configuration().theme()).toBe(WHITELABEL_THEMES.light);
      expect(configuration().logo()).toBe('/light.png');
    });

    it('falls back to the Appknox branding for anything it did not name', () => {
      configuration().setFrontendConfiguration(buildFrontendConfiguration());

      expect(configuration().name()).toBe('Appknox');
      expect(configuration().favicon()).toBe('/images/favicon.ico');
      expect(configuration().logo()).toBe('/images/logo-white.png');
    });

    it('shows the Appknox branding when the request failed', () => {
      configuration().setFrontendConfiguration(null);

      expect(configuration().name()).toBe('Appknox');
      expect(configuration().hasFetchedFrontend).toBe(true);
    });
  });

  describe('whether the login page offers registration', () => {
    it('offers it on a deployment that signs people up itself', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_enabled: true })
      );

      expect(configuration().showRegistrationLink()).toBe(true);
    });

    it('offers it on a deployment that points somewhere else to sign up', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_link: 'https://appknox.com/signup' })
      );

      expect(configuration().showRegistrationLink()).toBe(true);
    });

    it('withholds it when a relative link is all that is set', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_link: '/register' })
      );

      expect(configuration().showRegistrationLink()).toBe(false);
    });

    it('withholds it on a deployment that says nothing about registering', () => {
      configuration().setFrontendConfiguration(buildFrontendConfiguration());

      expect(configuration().showRegistrationLink()).toBe(false);
    });

    it('withholds it when the request failed', () => {
      configuration().setFrontendConfiguration(null);

      expect(configuration().showRegistrationLink()).toBe(false);
    });
  });

  describe('whether the tab is on an Appknox host', () => {
    it('reads the address bar, not the configuration', () => {
      window.history.replaceState({}, '', '/login');

      expect(configuration().isAppknoxUrl()).toBe(false);
    });
  });

  describe('where the install keeps its services', () => {
    it('takes the socket and device farm hosts it named', () => {
      const answer = buildServerConfiguration();

      configuration().setServerConfiguration(answer);

      expect(configuration().socketHost()).toBe(answer.websocket);
      expect(configuration().deviceFarmUrl()).toBe(answer.devicefarm_url);
    });

    it('marks a self-hosted install as enterprise', () => {
      configuration().setServerConfiguration(buildServerConfiguration({ enterprise: true }));

      expect(configuration().isEnterprise()).toBe(true);
    });

    it('falls back to the API host when it names no socket', () => {
      configuration().setServerConfiguration(buildServerConfiguration({ websocket: '' }));

      expect(configuration().socketHost()).toBe(BUILD_API_HOST);
    });

    it('opens against the same origin when nothing names a socket at all', () => {
      globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: '/' };

      configuration().setServerConfiguration(buildServerConfiguration({ websocket: '' }));

      expect(configuration().socketHost()).toBe('/');
    });

    it('keeps the install sellable when the request failed', () => {
      configuration().setServerConfiguration(null);

      expect(configuration().isEnterprise()).toBe(false);
      expect(configuration().socketHost()).toBe(BUILD_API_HOST);
      expect(configuration().hasFetchedServer).toBe(true);
    });
  });

  describe('where this organization keeps its services', () => {
    it('takes the dashboard host it named', () => {
      const answer = buildDashboardConfig();

      configuration().setDashboardConfiguration(answer);

      expect(configuration().dashboardUrl()).toBe(answer.dashboard_url);
      expect(configuration().hasFetchedDashboard).toBe(true);
    });

    it("prefers the organization's own device farm over the install's", () => {
      configuration().setServerConfiguration(
        buildServerConfiguration({ devicefarm_url: 'https://farm.install.test' })
      );

      configuration().setDashboardConfiguration(
        buildDashboardConfig({ devicefarm_url: 'https://farm.organization.test' })
      );

      expect(configuration().deviceFarmUrl()).toBe('https://farm.organization.test');
    });

    it("falls back to the install's device farm when the organization names none", () => {
      configuration().setServerConfiguration(
        buildServerConfiguration({ devicefarm_url: 'https://farm.install.test' })
      );

      configuration().setDashboardConfiguration(buildDashboardConfig({ devicefarm_url: '' }));

      expect(configuration().deviceFarmUrl()).toBe('https://farm.install.test');
    });

    it('leaves the hosts empty when the request failed', () => {
      configuration().setDashboardConfiguration(null);

      expect(configuration().dashboardUrl()).toBe('');
      expect(configuration().hasFetchedDashboard).toBe(true);
    });

    it('resets every slice and flag on clear', () => {
      configuration().setFrontendConfiguration(buildFrontendConfiguration({ name: 'Securely' }));
      configuration().setServerConfiguration(buildServerConfiguration({ enterprise: true }));
      configuration().setDashboardConfiguration(buildDashboardConfig());

      configuration().clear();

      expect(configuration().hasFetchedFrontend).toBe(false);
      expect(configuration().hasFetchedServer).toBe(false);
      expect(configuration().hasFetchedDashboard).toBe(false);
      expect(configuration().name()).toBe('Appknox');
      expect(configuration().isEnterprise()).toBe(false);
      expect(configuration().dashboardUrl()).toBe('');
    });
  });
});
