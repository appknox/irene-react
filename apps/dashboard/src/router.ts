import { createRouter } from '@tanstack/react-router';

import { RouteError } from '@/components/RouteError';
import { RouteNotFound } from '@/components/RouteNotFound';
import { RoutePending } from '@/components/RoutePending';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
