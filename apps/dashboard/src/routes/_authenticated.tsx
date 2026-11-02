import { createFileRoute, redirect } from '@tanstack/react-router';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { claimEmberHandover } from '@/components/ember-paths';
import { RouteError } from '@/components/route-error';
import { RoutePending } from '@/components/route-pending';
import { sessionCheckOptions } from '@/features/auth/queries/session';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { returnPathFor } from '@/utils/login-return-path';

export const Route = createFileRoute('/_authenticated')({
  //  Sends anyone without a live session to the login page, and back here afterwards.
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(sessionCheckOptions());

    if (!session) {
      throw redirect({
        to: '/login',
        search: { unauthenticated: true, redirectTo: returnPathFor(location) },
      });
    }

    /*
      A screen the Ember app still serves is loaded from there. Thrown before
      the navigation is committed, so this app keeps the page it is on rather
      than painting a placeholder while the other app's document arrives.

      `reloadDocument` is required: a root-relative href without it is treated
      as an internal navigation and resolves to the not-found route.
    */
    const emberHref = claimEmberHandover(location.pathname);

    if (emberHref) {
      throw redirect({ href: emberHref, reloadDocument: true, replace: true });
    }

    return { session };
  },

  //  Loads the account and the organization it belongs to.
  loader: ({ context }) => setupUserAndOrgContext(context.queryClient, context.session.userId),
  pendingComponent: RoutePending,
  errorComponent: RouteError,

  /*
    Shown almost at once rather than after the router's default second of
    nothing: this loader fetches on a cold start, so the wait it covers is the
    app opening, not a page swapping.
  */
  pendingMs: 200,
  component: AuthenticatedLayout,
});
