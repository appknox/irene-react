import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the endpoints that authorize an OIDC client against this account. */
export const OidcEndpoints = {
  /** Reads what the client is asking for, and whether the account must be asked. */
  authorization: () => `${API_NAMESPACES.v2}/oidc/authorization` as const,

  /** Checks an OIDC token before anything is shown for it. */
  validate: () => `${API_NAMESPACES.v2}/oidc/authorization/validate` as const,

  /** Grants or refuses the client, and answers with where to send the browser. */
  authorize: () => `${API_NAMESPACES.v2}/oidc/authorization/authorize` as const,
};
