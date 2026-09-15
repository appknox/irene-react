import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the sign-in, session check and sign-out endpoints. */
export const AuthEndpoints = {
  check: () => `${API_NAMESPACES.v1}/check` as const,
  login: () => `${API_NAMESPACES.v1}/login` as const,
  logout: () => `${API_NAMESPACES.v1}/logout` as const,
};

/** Query key for the restored session. */
export const AUTH_SESSION_QUERY_KEY = 'AUTH_SESSION_QUERY_KEY';
