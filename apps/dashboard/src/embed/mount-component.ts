import { createElement, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { RoutePending } from '@/components/route-pending';

import {
  EMBEDDABLE_PAGES,
  findEmbeddablePage,
  type EmbeddablePage,
  type EmbeddablePageName,
} from './pages';

import { EmbedProviders } from './providers';
import { applyEmbedConfig, linkStylesheet } from './runtime';
import { ScreenContext } from './screen-context';

export interface ComponentMountOptions {
  /*
    Which page to render. The registered names are offered, and any string is
    accepted: a host names the page at runtime and may name one that has been
    migrated away, which is what `resolvePage` refuses.
  */
  name: EmbeddablePageName | (string & NonNullable<unknown>);

  /** What to render it with. */
  props?: Record<string, unknown>;

  /** Build-time configuration the host resolved. */
  config?: Record<string, string>;

  /** The host's build, so a new one is not served the stylesheet of the last. */
  version?: string;
}

export interface MountedComponent {
  /** Renders again with new props, keeping the React tree and its state. */
  update(props?: Record<string, unknown>): void;

  /** Takes the component down. */
  destroy(): void;
}

/**
 * Looks a page up by name.
 *
 * Refuses an unknown name rather than rendering nothing, so a typo in a host's
 * template fails where it is made instead of leaving an empty box behind.
 *
 * @param name - The name the host asked for.
 * @returns The page to render.
 */
function resolvePage(name: string): EmbeddablePage {
  const page = findEmbeddablePage(name);

  if (!page) {
    const known = Object.keys(EMBEDDABLE_PAGES);

    throw new Error(
      `No embeddable page named "${name}". ` +
        (known.length > 0 ? `Known pages: ${known.join(', ')}.` : 'None are registered yet.')
    );
  }

  return page;
}

/**
 * Renders one component of this application inside a host's own page.
 *
 * Unlike a page, a component has no router, no route and no guards — it takes
 * props and renders. Only the providers it could reach for are around it: the
 * translations, the query cache and the toaster.
 *
 * @param element - Where it renders. The host must not touch its contents.
 * @param options - Which component, and what to render it with.
 * @returns A handle for updating and taking it down.
 */
export function mountIreneComponent(
  element: HTMLElement,
  options: ComponentMountOptions
): MountedComponent {
  const Page = resolvePage(options.name);

  applyEmbedConfig(options.config);
  linkStylesheet(options.version);

  element.dataset.reactRoot = '';

  const root: Root = createRoot(element);

  /*
    The context goes inside the providers and around the screen: a screen reads
    the organization from a store the signed-in routes fill, and no route runs
    here.

    Suspense sits inside both, so the waiting state renders with the app's own
    styles and the context keeps loading while the screen's code arrives.
  */
  const draw = (props?: Record<string, unknown>) =>
    root.render(
      createElement(
        EmbedProviders,
        null,
        createElement(
          ScreenContext,
          null,
          createElement(
            Suspense,
            { fallback: createElement(RoutePending) },
            createElement(Page, props)
          )
        )
      )
    );

  draw(options.props);

  return {
    update: draw,

    /* Unmounting inside the host's own teardown warns, so it waits a tick. */
    destroy() {
      setTimeout(() => root.unmount(), 0);
    },
  };
}
