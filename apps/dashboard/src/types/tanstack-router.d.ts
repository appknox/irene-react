import type { router, RouterPageTitleContext } from '@/router';

/**
 * What this app adds to the router's own types.
 *
 * Kept apart from the router itself so that file stays runtime code, and so
 * anything else we teach the router about has one place to live.
 */
declare module '@tanstack/react-router' {
  /** Types every `Link`, `useSearch` and `getRouteApi` against our own tree. */
  interface Register {
    router: typeof router;
  }

  /**
   * A route names the page it shows, which the document head puts in the tab.
   *
   * Read on render rather than held as text, so a title follows the locale the
   * same way the page under it does.
   *
   * Declared as a method so a route may narrow the context to its own params.
   * Read and composed by `@/components/document-head`.
   */
  interface StaticDataRouteOption {
    pageTitle?(context: RouterPageTitleContext): string;
  }
}
