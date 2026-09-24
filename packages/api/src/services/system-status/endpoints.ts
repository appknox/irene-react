import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the checks the system status page runs. */
export const StatusEndpoints = {
  /** Hands back a pre-signed URL that proves the object store is reachable. */
  status: () => `${API_NAMESPACES.v1}/status` as const,

  /** Answers `{ ping: 'pong' }` while the API itself is up. */
  ping: () => `${API_NAMESPACES.v1}/ping` as const,
};
