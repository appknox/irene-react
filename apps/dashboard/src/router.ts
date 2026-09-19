import { createRouter } from '@tanstack/react-router';

import { queryClient } from '@irene/api';

import { RouteError } from '@/components/route-error';
import { RouteNotFound } from '@/components/route-not-found';
import { RoutePending } from '@/components/route-pending';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  context: { queryClient },
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
