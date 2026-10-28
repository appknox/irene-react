/*
  Responses handed to the embedded React pages.

  Both applications load the same endpoints as a session begins — the
  configuration, the organization, the account. This app fetches them for its
  own screens, so what has already arrived is offered to the React side rather
  than fetched a second time.

  Only these endpoints are held. Anything else an embedded page asks for is its
  own request, so nothing here can answer with something stale.
*/

/*
  The endpoints both applications load, limited to those this app fetches as
  plain JSON.

  The record endpoints are deliberately absent. Those go through Ember Data,
  whose adapter is free to hand `handleResponse` something other than the
  response body, and the React side would transform whatever it was given
  without complaint — an organization list that comes back empty leaves the
  store unset and the pages that read it behaving as though the account has
  nothing.
*/
const SHARED_ENDPOINTS = [
  'api/v2/server_configuration',
  'api/v2/frontend_configuration',
  'api/v2/dashboard_configuration',
];

const responses = new Map<string, unknown>();

/**
 * Reduces a URL to the path the React side names it by.
 *
 * @param url - The requested URL, absolute or relative.
 * @returns The path, without a leading slash or a query string.
 */
function toPath(url: string): string {
  const path = url.startsWith('http') ? new URL(url).pathname : url;

  return path.replace(/^\//, '').split('?')[0] ?? '';
}

/**
 * Keeps a response, if it is one both applications load.
 *
 * @param url - The URL that was requested.
 * @param payload - What came back.
 */
export function keepSharedResponse(url: string, payload: unknown) {
  const path = toPath(url);

  if (SHARED_ENDPOINTS.includes(path)) {
    responses.set(path, payload);
  }
}

/**
 * What this app has already fetched, for an embedded page to read instead of
 * requesting it again.
 *
 * @returns Payloads by request path.
 */
export function sharedResponses(): Record<string, unknown> {
  return Object.fromEntries(responses);
}
