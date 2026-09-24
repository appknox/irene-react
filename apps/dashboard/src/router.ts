import { createRouter, type ResolveParams } from '@tanstack/react-router';

import { queryClient } from '@irene/api';
import { RouteNotFound } from '@/components/route-not-found';
import { routeTree } from '@/routeTree.gen';
import type { RootRouterContext } from '@/routes/__root';

/**
 * What every router built from this tree shows for a URL it does not have.
 * Shared with the test router, so a test sees the same screens as a browser.
 *
 * Waiting and failing are not here: the signed-in routes declare their own,
 * since they are the ones that fetch before they can render.
 */
export const IRENE_DASHBOARD_ROUTER_DEFAULTS = {
  routeTree,
  defaultNotFoundComponent: RouteNotFound,
} as const;

/**
 * =============================================
 * Irene Dashboard Router
 * =============================================
 */

export const ireneDashboardRouter = createRouter({
  ...IRENE_DASHBOARD_ROUTER_DEFAULTS,
  context: { queryClient },
  scrollRestoration: true,
});

/**
 * The route match a `pageTitle` is given. Passed by `@/components/document-head`;
 * the option is declared in `@/types/tanstack-router`.
 *
 * Pass the route's path to type its params: `RouterPageTitleContext<'/reset/$token'>`
 * gives `params.token`. Params are parsed from the path because reading the
 * route tree from a route file is a circular import.
 *
 * For the same reason `search` and `loaderData` are untyped here; a route that
 * reads them annotates them itself.
 *
 * @interface RouterPageTitleContext
 * @property {object} params - The path segments, which identify the record the page names.
 * @property {object} search - The query the page was asked for with.
 * @property {RootRouterContext} context - What the route guards put there, the query cache included.
 * @property {unknown} loaderData - Whatever this route's loader resolved, absent until it has.
 * @property {string} pathname - The URL this match stands for.
 */
export interface RouterPageTitleContext<TPath extends string = string> {
  params: ResolveParams<TPath>;
  search: Record<string, unknown>;
  context: RootRouterContext;
  loaderData?: unknown;
  pathname: string;
}
