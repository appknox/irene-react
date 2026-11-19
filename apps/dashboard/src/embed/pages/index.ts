import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** What a page rendered inside a host may be handed. */
export type EmbeddablePage = LazyExoticComponent<ComponentType<Record<string, unknown>>>;

/*
  The pages a host may render by name.

  Each is loaded on demand, so a host downloads the screen it named and none of
  the others. A page is added here once it is migrated and a host wants it
  inside one of its own routes.

  A screen that needs more than its own component — its own router for tabs,
  say — gets a file of its own in this directory and is registered from there.
*/
export const EMBEDDABLE_PAGES = {
  HomePage: lazy(async () => ({
    default: (await import('@/features/dashboard/pages/home')).HomePage,
  })),
} satisfies Record<string, EmbeddablePage>;

/** The names a host may ask for. Read from the registry, so adding a page adds a name. */
export type EmbeddablePageName = keyof typeof EMBEDDABLE_PAGES;

/*
  Looked up through a Map rather than by indexing the registry: a host names
  the page at runtime and may name one that does not exist, which indexing an
  object of known keys would not admit.
*/
const pagesByName = new Map<string, EmbeddablePage>(Object.entries(EMBEDDABLE_PAGES));

/**
 * Finds a page by the name a host asked for.
 *
 * @param name - The name the host asked for.
 * @returns The page, or nothing where no page is registered under that name.
 */
export function findEmbeddablePage(name: string): EmbeddablePage | undefined {
  return pagesByName.get(name);
}
