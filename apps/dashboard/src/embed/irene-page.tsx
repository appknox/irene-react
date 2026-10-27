import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { queryClient } from '@irene/api';
import { IRENE_DASHBOARD_ROUTER_DEFAULTS } from '@/router';

import { EmbedProviders } from './providers';

interface IrenePageProps {
  /**
   * The page to render, as this app spells it. Defaults to whatever the host
   * has in the address bar, which is the same URL for every page migrated so
   * far — so a host usually passes nothing.
   */
  path?: string;
}

/**
 * Renders whichever page of this app answers a path, inside a host that owns
 * the URL.
 *
 * The real route tree is used, not a tree built for the occasion. A finished
 * page reads its own route — `getRouteApi(...).useParams()` for a parameter,
 * the route's loader for its data, the guards above it for the session — so
 * the route it names has to be the one it is rendered under. That also means
 * guards and loaders run exactly as they do in this app on its own.
 *
 * The history is in memory, so this router never writes to the address bar.
 * The host owns it, and the host's own links keep working.
 */
export function IrenePage({ path }: Readonly<IrenePageProps>) {
  const [router] = useState(() =>
    createRouter({
      ...IRENE_DASHBOARD_ROUTER_DEFAULTS,
      context: { queryClient },
      history: createMemoryHistory({
        initialEntries: [path ?? `${window.location.pathname}${window.location.search}`],
      }),
    })
  );

  /* A host that changes the path without reloading, which a route parameter does. */
  useEffect(() => {
    if (path && router.state.location.href !== path) {
      router.navigate({ href: path, replace: true });
    }
  }, [path, router]);

  return (
    <EmbedProviders>
      <RouterProvider router={router} />
    </EmbedProviders>
  );
}
