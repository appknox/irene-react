export const API_NAMESPACES = {
  v1: 'api',
  v2: 'api/v2',
  v3: 'api/v3',
  hudson: 'api/hudson-api',
} as const;

export type ApiNamespace = (typeof API_NAMESPACES)[keyof typeof API_NAMESPACES];

/** Leading slashes on the resource collapse. */
export function buildUrl(namespace: ApiNamespace, path: string): string {
  const resource = path.replace(/^\/+/, '');

  return resource ? `${namespace}/${resource}` : namespace;
}
