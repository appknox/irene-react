/*
  The screens this app no longer draws itself.

  The ledger for the migration: a path leaves this list when its screen moves
  back, and nothing else has to be kept in step. It is read before this app
  loads a route, so the React side can start fetching alongside it rather than
  after it.
*/

/** Paths the React side answers, matched as prefixes. */
const REACT_PAGES = ['/dashboard/home', '/reset/', '/saml2/redirect'];

/**
 * Whether the React side draws the screen at a path.
 *
 * @param pathname - The path being transitioned to.
 * @returns Whether a React page answers it.
 */
export function isReactPage(pathname: string): boolean {
  return REACT_PAGES.some((path) => pathname === path || pathname.startsWith(path));
}
