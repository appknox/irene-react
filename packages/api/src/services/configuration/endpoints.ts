import { API_NAMESPACES } from '@irene/api/namespaces';

/**
 * Paths for what the deployment says about itself. Both answer before anyone
 * signs in, since the login page is branded too.
 */
export const ConfigurationEndpoints = {
  /** Branding, theme, and the keys the third-party widgets need. */
  frontend: () => `${API_NAMESPACES.v2}/frontend_configuration` as const,

  /** What the backend itself provides, such as where the socket lives. */
  server: () => `${API_NAMESPACES.v2}/server_configuration` as const,

  /** Where this organization's own services live, such as its device farm. */
  dashboard: () => `${API_NAMESPACES.v2}/dashboard_configuration` as const,
};
