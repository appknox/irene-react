import { API_NAMESPACES } from '@irene/api/namespaces';

/**
 * Paths for the Freshdesk support widget.
 *
 * The trailing slash is required. The router serving this path is built with
 * `SimpleRouter(trailing_slash="/?")`, and DRF reduces any truthy argument to
 * a plain `/`, so the optional slash that reads as intended never takes effect.
 * Without it the path does not match and the request is answered 404.
 */
export const FreshdeskEndpoints = {
  authenticate: () => `${API_NAMESPACES.v2}/freshdesk/authenticate/` as const,
};
