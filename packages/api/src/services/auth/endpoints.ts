import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for every endpoint that signs a user in, checks them, or signs them out. */
export const AuthEndpoints = {
  /** Checks the user's authentication status. */
  check: () => `${API_NAMESPACES.v1}/check` as const,

  /** Logs the user in. */
  login: () => `${API_NAMESPACES.v1}/login` as const,

  /** Logs the user out. */
  logout: () => `${API_NAMESPACES.v1}/logout` as const,

  /** Recovers a user's password. */
  recover: () => `${API_NAMESPACES.v2}/forgot_password` as const,

  /** Resets a user's password. */
  resetPassword: (token: string) => `${API_NAMESPACES.v2}/forgot_password/${token}` as const,

  /** Checks the user's SSO status. */
  ssoCheck: () => `${API_NAMESPACES.v2}/sso/check` as const,

  /** Starts the SAML2 login process. */
  samlStart: () => `${API_NAMESPACES.v1}/sso/saml2` as const,

  /** Logs the user in via SAML2. */
  samlLogin: () => `${API_NAMESPACES.v1}/sso/saml2/login` as const,

  /** Starts the OIDC login process. */
  oidcStart: () => `${API_NAMESPACES.v1}/sso/oidc/authenticate` as const,

  /** Completes the OIDC login process. */
  oidcCallback: () => `${API_NAMESPACES.v1}/sso/oidc/callback` as const,
};
