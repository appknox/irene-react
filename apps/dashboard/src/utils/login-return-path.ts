import { z } from 'zod';

/**
 * A path inside this app: a leading slash, and not a second one, which would
 * make it a protocol-relative URL pointing at another host.
 */
const INTERNAL_PATH = /^\/(?!\/)/;

/**
 * Where to send the user once they have signed in.
 *
 * Only a path is accepted. An absolute URL would let a crafted link send
 * someone to another site through our own login page.
 */
export const returnPathSchema = z.string().regex(INTERNAL_PATH).optional().catch(undefined);

/**
 * The path the browser is on, for a guard to hand to the login page.
 *
 * @param location - The router's current location.
 * @returns The path with its query, e.g. `/dashboard/oidc/redirect?oidc_token=abc`.
 */
export const returnPathFor = (location: { pathname: string; searchStr: string }) =>
  `${location.pathname}${location.searchStr}`;
