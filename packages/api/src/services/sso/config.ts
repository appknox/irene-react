import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the SSO endpoints. */
export const SsoEndpoints = {
  check: () => `${API_NAMESPACES.v2}/sso/check` as const,
};

/** Query key for an SSO check. */
export const SSO_CHECK_QUERY_KEY = 'SSO_CHECK_QUERY_KEY';
