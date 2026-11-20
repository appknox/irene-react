import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for what the public API documents about itself. */
export const PublicApiEndpoints = {
  /** The OpenAPI document describing every published endpoint. */
  schema: () => `${API_NAMESPACES.v1}/public_api/schema` as const,
};
