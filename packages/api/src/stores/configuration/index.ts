import { createStore } from 'zustand/vanilla';

import { getConfigValue } from '@irene/config';

import type {
  ApiFrontendConfiguration,
  ApiFrontendImages,
  ApiFrontendIntegrations,
  ApiFrontendTheme,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

/** The two schemes a deployment can ask for. Anything else is treated as dark. */
export const WHITELABEL_THEMES = { dark: 'dark', light: 'light' } as const;
export type WhitelabelTheme = (typeof WHITELABEL_THEMES)[keyof typeof WHITELABEL_THEMES];

/** The branding and registration settings, without the nested groups. */
type FrontendData = Omit<ApiFrontendConfiguration, 'images' | 'theme' | 'integrations'>;

/**
 * What the configuration endpoints answered, and what the app reads off them.
 *
 * The data is held as it arrived. Every value the app actually uses — a name
 * with the Appknox fallback applied, the logo for the current scheme, the host
 * to open a socket against — is read through a method, so the fallbacks live
 * in one place rather than at each call site.
 *
 * @interface ConfigurationStore
 * @property {boolean} hasFetchedFrontend - Whether the frontend configuration has been asked for.
 * @property {boolean} hasFetchedServer - Whether the server configuration has been asked for.
 * @property {object} frontendData - The branding and registration settings, as they arrived.
 * @property {object} themeData - The palette, as it arrived.
 * @property {object} imageData - The logos and favicon, as they arrived.
 * @property {object} integrationData - The third-party keys, as they arrived.
 * @property {object} serverData - Where the install keeps its services, as it arrived.
 * @property {function} setFrontendConfiguration - Stores the frontend response, or marks it unavailable with null.
 * @property {function} setServerConfiguration - Stores the server response, or marks it unavailable with null.
 * @property {function} name - The product name.
 * @property {function} theme - The colour scheme to render in.
 * @property {function} favicon - The tab icon.
 * @property {function} logo - The logo for the current scheme.
 * @property {function} showRegistrationLink - Whether the login page offers a way to register.
 * @property {function} registrationLink - Where signing up sends them.
 * @property {function} isAppknoxUrl - Whether this tab is on an Appknox host, where Appknox answers its own support.
 * @property {function} isEnterprise - Whether this install is self-hosted, which suppresses every upsell.
 * @property {function} socketHost - The host the realtime connection opens against.
 * @property {function} deviceFarmUrl - The host device farm sessions run on.
 */
interface ConfigurationStore {
  hasFetchedFrontend: boolean;
  hasFetchedServer: boolean;

  frontendData: FrontendData;
  themeData: ApiFrontendTheme;
  imageData: ApiFrontendImages;
  integrationData: ApiFrontendIntegrations;
  serverData: ApiServerConfiguration;

  setFrontendConfiguration: (configuration: ApiFrontendConfiguration | null) => void;
  setServerConfiguration: (configuration: ApiServerConfiguration | null) => void;

  name: () => string;
  theme: () => WhitelabelTheme;
  favicon: () => string;
  logo: () => string;
  showRegistrationLink: () => boolean;
  registrationLink: () => string;
  isAppknoxUrl: () => boolean;
  isEnterprise: () => boolean;
  socketHost: () => string;
  deviceFarmUrl: () => string;
}

const EXTERNAL_LINK = /^https?:\/\//i;

/** Same origin as the app, for an install that names no socket host anywhere. */
const SAME_ORIGIN = '/';

/** The hosts Appknox serves itself from, rather than on a customer's domain. */
const APPKNOX_HOSTS = ['secure.appknox.com'];

/** What an unbranded install shows, for anything the frontend configuration does not name. */
const WHITELABEL_DEFAULTS = {
  name: 'Appknox',
  favicon: '/images/favicon.ico',
  logoOnDarkBackground: '/images/logo-white.png',
  logoOnLightBackground: '/images/logo.png',
} as const;

const EMPTY_FRONTEND_DATA: FrontendData = {
  name: '',
  url: '',
  hide_poweredby_logo: false,
  registration_enabled: false,
  registration_link: '',
};

const EMPTY_THEME_DATA: ApiFrontendTheme = {
  scheme: '',
  primary_color: '',
  primary_alt_color: '',
  secondary_color: '',
  secondary_alt_color: '',
};

const EMPTY_IMAGE_DATA: ApiFrontendImages = {
  favicon: '',
  logo_on_darkbg: '',
  logo_on_lightbg: '',
};

const EMPTY_INTEGRATION_DATA: ApiFrontendIntegrations = {
  pendo_key: '',
  freshchat_key: '',
  freshdesk_configuration: { widget_id: '' },
};

const EMPTY_SERVER_DATA: ApiServerConfiguration = {
  websocket: '',
  devicefarm_url: '',
  enterprise: false,
};

/**
 * What this install told the app about itself at boot.
 *
 * Lives outside React because the document title and favicon are set from it,
 * and because the realtime connection and the device farm client are opened
 * from plain modules rather than from a component.
 */
export const configurationStore = createStore<ConfigurationStore>((set, get) => ({
  hasFetchedFrontend: false,
  hasFetchedServer: false,

  frontendData: EMPTY_FRONTEND_DATA,
  themeData: EMPTY_THEME_DATA,
  imageData: EMPTY_IMAGE_DATA,
  integrationData: EMPTY_INTEGRATION_DATA,
  serverData: EMPTY_SERVER_DATA,

  name: () => get().frontendData.name || WHITELABEL_DEFAULTS.name,
  registrationLink: () => get().frontendData.registration_link,
  isAppknoxUrl: () => APPKNOX_HOSTS.some((host) => window.location.href.includes(host)),
  isEnterprise: () => Boolean(get().serverData.enterprise),
  socketHost: () => get().serverData.websocket || getConfigValue('IRENE_API_HOST') || SAME_ORIGIN,
  deviceFarmUrl: () => get().serverData.devicefarm_url,
  favicon: () => get().imageData.favicon || WHITELABEL_DEFAULTS.favicon,

  // Anything but an explicit light scheme is dark.
  theme: () =>
    get().themeData.scheme === WHITELABEL_THEMES.light
      ? WHITELABEL_THEMES.light
      : WHITELABEL_THEMES.dark,

  /*
    A deployment that signs nobody up itself may still point at somewhere that
    does, so an external link counts even with registration switched off.
  */
  showRegistrationLink: () =>
    get().frontendData.registration_enabled ||
    EXTERNAL_LINK.test(get().frontendData.registration_link),

  // Resolves the logo for the current theme.
  logo: () => {
    const isLightTheme = get().theme() === WHITELABEL_THEMES.light;
    const imageData = get().imageData;

    if (isLightTheme) {
      return imageData.logo_on_lightbg || WHITELABEL_DEFAULTS.logoOnLightBackground;
    }

    return imageData.logo_on_darkbg || WHITELABEL_DEFAULTS.logoOnDarkBackground;
  },

  // Frontend configuration updater
  setFrontendConfiguration: (configuration) => {
    if (configuration) {
      const { images, theme, integrations, ...frontendData } = configuration;

      set({
        hasFetchedFrontend: true,
        frontendData,
        themeData: theme,
        imageData: images,
        integrationData: integrations,
      });
    } else {
      // A request that failed leaves the data empty, which the readers answer with defaults.
      set({ hasFetchedFrontend: true });
    }
  },

  // Server configuration updater
  setServerConfiguration: (configuration) =>
    set({ hasFetchedServer: true, serverData: configuration ?? EMPTY_SERVER_DATA }),
}));
