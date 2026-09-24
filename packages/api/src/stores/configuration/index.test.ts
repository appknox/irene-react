import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildDashboardConfig,
  buildFrontendConfiguration,
  buildServerConfiguration,
} from '@tests/factories';

import { configurationStore, WHITELABEL_THEMES } from '@irene/api/stores/configuration';

const BUILD_API_HOST = 'https://api.appknox.test';

const configuration = () => configurationStore.getState();

describe('configurationStore', () => {
  beforeEach(() => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: BUILD_API_HOST };
  });

  afterEach(() => {
    configurationStore.setState(configurationStore.getInitialState(), true);
  });

  describe('the frontend configuration slice', () => {
    it('stores the name, favicon and logo from the response', () => {
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

    it('resolves the theme to dark for any scheme but an explicit light one', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          theme: { ...buildFrontendConfiguration().theme, scheme: 'something-else' },
        })
      );

      expect(configuration().theme()).toBe(WHITELABEL_THEMES.dark);
    });

    it('falls back to the Appknox light logo when a light deployment names none', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          images: { favicon: '', logo_on_darkbg: '', logo_on_lightbg: '' },
          theme: { ...buildFrontendConfiguration().theme, scheme: 'light' },
        })
      );

      expect(configuration().logo()).toBe('/images/logo.png');
    });

    it('resolves the light logo when the scheme is light', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({
          theme: { ...buildFrontendConfiguration().theme, scheme: 'light' },
          images: { favicon: '', logo_on_darkbg: '/dark.png', logo_on_lightbg: '/light.png' },
        })
      );

      expect(configuration().theme()).toBe(WHITELABEL_THEMES.light);
      expect(configuration().logo()).toBe('/light.png');
    });

    it('falls back to the Appknox branding for any image the response omits', () => {
      configuration().setFrontendConfiguration(buildFrontendConfiguration());

      expect(configuration().name()).toBe('Appknox');
      expect(configuration().favicon()).toBe('/images/favicon.ico');
      expect(configuration().logo()).toBe('/images/logo-white.png');
    });

    it('falls back to the Appknox branding when the request fails', () => {
      configuration().setFrontendConfiguration(null);

      expect(configuration().name()).toBe('Appknox');
      expect(configuration().hasFetchedFrontend).toBe(true);
    });
  });

  describe('showRegistrationLink', () => {
    it('is true when registration_enabled is set', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_enabled: true })
      );

      expect(configuration().showRegistrationLink()).toBe(true);
    });

    it('is true when registration_link names an absolute URL', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_link: 'https://appknox.com/signup' })
      );

      expect(configuration().showRegistrationLink()).toBe(true);
      expect(configuration().registrationLink()).toBe('https://appknox.com/signup');
    });

    it('is false when registration_link is relative', () => {
      configuration().setFrontendConfiguration(
        buildFrontendConfiguration({ registration_link: '/register' })
      );

      expect(configuration().showRegistrationLink()).toBe(false);
    });

    it('is false when the response sets neither field', () => {
      configuration().setFrontendConfiguration(buildFrontendConfiguration());

      expect(configuration().showRegistrationLink()).toBe(false);
    });

    it('is false when the request fails', () => {
      configuration().setFrontendConfiguration(null);

      expect(configuration().showRegistrationLink()).toBe(false);
    });
  });

  describe('isAppknoxUrl', () => {
    it('reads window.location, not the configuration response', () => {
      window.history.replaceState({}, '', '/login');

      expect(configuration().isAppknoxUrl()).toBe(false);
    });
  });

  describe('the server configuration slice', () => {
    it('stores the socket and device farm hosts from the response', () => {
      const answer = buildServerConfiguration();

      configuration().setServerConfiguration(answer);

      expect(configuration().socketHost()).toBe(answer.websocket);
      expect(configuration().deviceFarmUrl()).toBe(answer.devicefarm_url);
    });

    it('reports isEnterprise for a self-hosted install', () => {
      configuration().setServerConfiguration(buildServerConfiguration({ enterprise: true }));

      expect(configuration().isEnterprise()).toBe(true);
    });

    it('falls back to the API host when the response names no socket', () => {
      configuration().setServerConfiguration(buildServerConfiguration({ websocket: '' }));

      expect(configuration().socketHost()).toBe(BUILD_API_HOST);
    });

    it('falls back to the same origin when nothing names a socket', () => {
      globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: '/' };

      configuration().setServerConfiguration(buildServerConfiguration({ websocket: '' }));

      expect(configuration().socketHost()).toBe('/');
    });

    it('reports isEnterprise false when the request fails', () => {
      configuration().setServerConfiguration(null);

      expect(configuration().isEnterprise()).toBe(false);
      expect(configuration().socketHost()).toBe(BUILD_API_HOST);
      expect(configuration().hasFetchedServer).toBe(true);
    });
  });

  describe('the dashboard configuration slice', () => {
    it('stores the dashboard host from the response', () => {
      const answer = buildDashboardConfig();

      configuration().setDashboardConfiguration(answer);

      expect(configuration().dashboardUrl()).toBe(answer.dashboard_url);
      expect(configuration().hasFetchedDashboard).toBe(true);
    });

    it('resolves the device farm host from the dashboard configuration over the server one', () => {
      configuration().setServerConfiguration(
        buildServerConfiguration({ devicefarm_url: 'https://farm.install.test' })
      );

      configuration().setDashboardConfiguration(
        buildDashboardConfig({ devicefarm_url: 'https://farm.organization.test' })
      );

      expect(configuration().deviceFarmUrl()).toBe('https://farm.organization.test');
    });

    it('falls back to the server configuration device farm when the dashboard one is empty', () => {
      configuration().setServerConfiguration(
        buildServerConfiguration({ devicefarm_url: 'https://farm.install.test' })
      );

      configuration().setDashboardConfiguration(buildDashboardConfig({ devicefarm_url: '' }));

      expect(configuration().deviceFarmUrl()).toBe('https://farm.install.test');
    });

    it('leaves the hosts empty when the request fails', () => {
      configuration().setDashboardConfiguration(null);

      expect(configuration().dashboardUrl()).toBe('');
      expect(configuration().hasFetchedDashboard).toBe(true);
    });

    it('resets every slice and fetched flag on clear', () => {
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
