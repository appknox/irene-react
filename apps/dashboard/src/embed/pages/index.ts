import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { OrganizationScreenSkeleton } from '@/features/organization/layout/screen-skeleton';

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
  /*
    Every page of the organization, under one router: the three panes, the four
    settings tabs and the two service account screens. The host mounts it on
    each of the routes that serve those URLs and the screen opens at whichever
    one the address names, so moving between any of them stays in the browser.
  */
  Organization: lazy(async () => ({
    default: (await import('./organization')).Organization,
  })),

  /*
    The names the host used while these were three screens. They answer with the one screen
    above, so a host still asking for them — a page held in a browser from before this
    build, say — gets the page rather than nothing at all.
  */
  OrganizationSettings: lazy(async () => ({
    default: (await import('./organization')).Organization,
  })),

  OrganizationServiceAccount: lazy(async () => ({
    default: (await import('./organization')).Organization,
  })),
} satisfies Record<string, EmbeddablePage>;

/** The names a host may ask for. Read from the registry, so adding a page adds a name. */
export type EmbeddablePageName = keyof typeof EMBEDDABLE_PAGES;

/*
  What stands in for a page while its chunk is fetched.

  A page that draws its own frame registers a placeholder shaped like that
  frame, so the chrome is not withheld until the chunk lands. Registering one
  says this page draws the whole wait itself, so its host should hold no
  placeholder of its own; anything left out here leaves that to the host, and
  falls back to the generic panel placeholder where the host holds none.

  Imported rather than lazy: a placeholder that had to be fetched could not
  stand in for a fetch.
*/
const PAGE_SKELETONS: Partial<Record<EmbeddablePageName, ComponentType>> = {
  Organization: OrganizationScreenSkeleton,
  OrganizationSettings: OrganizationScreenSkeleton,
  OrganizationServiceAccount: OrganizationScreenSkeleton,
};

/**
 * Finds the placeholder registered for a page.
 *
 * @param name - The name the host asked for.
 * @returns The page's own placeholder, or nothing where it has none.
 */
export function findPageSkeleton(name: string): ComponentType | undefined {
  return Object.hasOwn(PAGE_SKELETONS, name)
    ? PAGE_SKELETONS[name as EmbeddablePageName]
    : undefined;
}

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
