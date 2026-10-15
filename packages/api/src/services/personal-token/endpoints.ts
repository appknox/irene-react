import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the API tokens the signed-in account has generated for itself. */
export const PersonalTokenEndpoints = {
  /** Lists the tokens (GET), and generates one (POST). */
  list: () => `${API_NAMESPACES.v1}/personaltokens` as const,

  /** Revokes one token (DELETE). */
  detail: (id: number | string) =>
    `${API_NAMESPACES.v1}/personaltokens/${encodeURIComponent(id)}` as const,
};
