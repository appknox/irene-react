import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the signed-in account's second factor. */
export const MfaEndpoints = {
  /** Lists the methods, enables or switches one (POST), and disables the active one (DELETE). */
  mfa: () => `${API_NAMESPACES.v2}/mfa` as const,
};
