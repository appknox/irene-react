/**
 * The OpenAPI document the public API serves.
 *
 * Only the members the documentation screen reads are named. The document is
 * handed to Swagger UI whole, which knows the rest of the specification, so
 * describing it further here would be describing it twice.
 */
export interface ApiOpenApiSchema {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: Array<Record<string, unknown>>;
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
}
