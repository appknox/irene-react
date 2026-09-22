import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the endpoints that sign a new account up. */
export const RegistrationEndpoints = {
  /** Registers an account, which the backend confirms by email. */
  register: () => `${API_NAMESPACES.v2}/registration` as const,
};
