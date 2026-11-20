import { apiRequest } from '@irene/api/request';

import { PublicApiEndpoints } from './endpoints';
import type { ApiOpenApiSchema } from './types';

/** Reads what the public API publishes about itself. */
export default class PublicApiService {
  /**
   * Fetches the OpenAPI document for the published endpoints.
   *
   * @returns The document, as Swagger UI expects it.
   */
  public static readonly getSchema = async (): Promise<ApiOpenApiSchema> =>
    apiRequest.get<ApiOpenApiSchema>(PublicApiEndpoints.schema());
}
