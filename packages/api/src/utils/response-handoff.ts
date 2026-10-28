/*
  Responses the host already holds.

  Both applications load the same handful of endpoints when a session begins —
  the configuration, the organization, the account. The host fetches them for
  its own screens, so it hands them over rather than having them fetched twice.

  The handoff is below the service layer on purpose. Each service shapes its
  own response, and some do more than return it, so handing a payload to the
  query cache instead would mean reproducing every transform.
*/

/** What the host handed over, by request path. Taken from, never added to. */
let handedOver = new Map<string, unknown>();

/**
 * Reduces a URL to the path both applications name it by.
 *
 * @param url - A URL in either application's spelling, absolute or relative.
 * @returns The path, without a leading slash or a query string.
 */
export function handoffKey(url: string): string {
  const path = url.startsWith('http') ? new URL(url).pathname : url;

  return path.replace(/^\//, '').split('?')[0] ?? '';
}

/**
 * Records what the host has already fetched.
 *
 * @param responses - Payloads by request path, in either application's spelling.
 */
export function offerHandedOverResponses(responses: Record<string, unknown>) {
  handedOver = new Map(Object.entries(responses).map(([url, body]) => [handoffKey(url), body]));
}

/**
 * Takes a response the host already has, removing it so it is used once.
 *
 * One use only: this exists to spare the duplicate fetch as a session begins.
 * A response that stayed would answer a later refetch with something stale.
 *
 * @param url - The URL being requested.
 * @returns The payload, or undefined when the host offered nothing for it.
 */
export function takeHandedOverResponse(url: string): unknown {
  const key = handoffKey(url);

  if (!handedOver.has(key)) {
    return undefined;
  }

  const payload = handedOver.get(key);

  handedOver.delete(key);

  return payload;
}
