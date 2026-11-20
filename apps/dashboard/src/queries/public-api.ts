import { queryOptions } from '@tanstack/react-query';
import { PublicApiService } from '@irene/api/services/public-api';

/** Keys for what the public API publishes about itself. */
export const publicApiKeys = {
  all: () => ['public-api'] as const,
  schema: () => [...publicApiKeys.all(), 'schema'] as const,
};

/**
 * Builds the query for the OpenAPI document.
 *
 * The document changes when the API is deployed, not while someone reads it,
 * so it is held for the life of the tab.
 *
 * @returns Query options resolving to the document.
 */
export const publicApiSchemaOptions = () =>
  queryOptions({
    queryKey: publicApiKeys.schema(),
    queryFn: PublicApiService.getSchema,
    staleTime: Infinity,
  });
