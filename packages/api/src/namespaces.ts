/** The backend serves several API generations, so an endpoint names its own. */
export const API_NAMESPACES = {
  v1: 'api',
  v2: 'api/v2',
  v3: 'api/v3',
  hudson: 'api/hudson-api',
} as const;

/** Any one of the API path prefixes. */
export type ApiNamespace = (typeof API_NAMESPACES)[keyof typeof API_NAMESPACES];
