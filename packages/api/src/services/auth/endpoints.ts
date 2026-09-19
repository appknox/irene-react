import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for every endpoint that signs a user in, checks them, or signs them out. */
export const AuthEndpoints = {
  check: () => `${API_NAMESPACES.v1}/check` as const,
  login: () => `${API_NAMESPACES.v1}/login` as const,
  logout: () => `${API_NAMESPACES.v1}/logout` as const,
  recover: () => `${API_NAMESPACES.v2}/forgot_password` as const,
  resetPassword: (token: string) => `${API_NAMESPACES.v2}/forgot_password/${token}` as const,
  ssoCheck: () => `${API_NAMESPACES.v2}/sso/check` as const,
  samlStart: () => `${API_NAMESPACES.v1}/sso/saml2` as const,
  samlLogin: () => `${API_NAMESPACES.v1}/sso/saml2/login` as const,
  oidcStart: () => `${API_NAMESPACES.v1}/sso/oidc/authenticate` as const,
  oidcCallback: () => `${API_NAMESPACES.v1}/sso/oidc/callback` as const,
};
