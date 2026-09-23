import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the endpoints that sign a new account up. */
export const RegistrationEndpoints = {
  /** Registers an account, which the backend confirms by email. */
  register: () => `${API_NAMESPACES.v2}/registration` as const,

  /** Reads an invitation, and registers the account it was sent to. */
  invite: () => `${API_NAMESPACES.v2}/registration-via-invite` as const,
};
