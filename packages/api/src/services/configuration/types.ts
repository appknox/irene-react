/**
 * ============================================================
 * FRONTEND CONFIGURATION
 * ============================================================
 */

/** The images a deployment brands itself with. */
export interface ApiFrontendImages {
  favicon: string;
  logo_on_darkbg: string;
  logo_on_lightbg: string;
}

/** The palette a deployment renders in. */
export interface ApiFrontendTheme {
  scheme: string;
  primary_color: string;
  primary_alt_color: string;
  secondary_color: string;
  secondary_alt_color: string;
}

/** Keys the third-party widgets need before they can start. */
export interface ApiFrontendIntegrations {
  pendo_key: string;
  freshchat_key: string;
  freshdesk_configuration: { widget_id: string };
}

/**
 * How this deployment presents itself: its name, its branding, and whether it
 * lets people register. Answers before sign-in, since the login page needs it.
 */
export interface ApiFrontendConfiguration {
  name: string;
  url: string;
  hide_poweredby_logo: boolean;
  registration_enabled: boolean;
  registration_link: string;
  images: ApiFrontendImages;
  theme: ApiFrontendTheme;
  integrations: ApiFrontendIntegrations;
}

/**
 * ============================================================
 * SERVER CONFIGURATION
 * ============================================================
 */

/** What the backend provides, as opposed to how the app looks. */
export interface ApiServerConfiguration {
  websocket: string;
  devicefarm_url: string;
  enterprise: boolean;
}
