import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the account signed in to this session. */
export const UserEndpoints = {
  detail: (id: number | string) => `${API_NAMESPACES.v1}/users/${encodeURIComponent(id)}` as const,
};
