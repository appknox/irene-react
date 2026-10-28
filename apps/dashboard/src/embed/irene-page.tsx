import { RouterProvider, type AnyRouter } from '@tanstack/react-router';

import { EmbedProviders } from './providers';

/**
 * Renders a page of this application under a router the host controls.
 *
 * The router is built outside this component so the host can watch it. A
 * finished page reads its own route — `getRouteApi(...).useParams()` for a
 * parameter, the route's loader for its data, the guards above it for the
 * session — so it has to be the real route tree.
 *
 * @param props.router - The router to render, holding the page being embedded.
 */
export function IrenePage({ router }: Readonly<{ router: AnyRouter }>) {
  return (
    <EmbedProviders>
      <RouterProvider router={router} />
    </EmbedProviders>
  );
}
