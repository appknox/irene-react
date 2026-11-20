import { createElement, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { akNotify } from '@irene/ui/notify';

import {
  EMBEDDABLE_PAGES,
  findEmbeddablePage,
  findPageSkeleton,
  type EmbeddablePage,
  type EmbeddablePageName,
} from './pages';

import { PageSkeleton } from './page-skeleton';
import { EmbedProviders } from './providers';
import { ReadySignal } from './ready-signal';
import { applyEmbedConfig, linkStylesheet } from './runtime';
import { ScreenContext } from './screen-context';

export interface ComponentMountOptions {
  /* Which page to render. Any string is accepted, since the host names it at runtime. */
  name: EmbeddablePageName | (string & NonNullable<unknown>);

  /** What to render it with. */
  props?: Record<string, unknown>;

  /** Build-time configuration the host resolved. */
  config?: Record<string, string>;

  /** The host's build, so a new one is not served the stylesheet of the last. */
  version?: string;

  /* Called once the page has content. Passing it means this app draws no placeholder. */
  onReady?: () => void;
}

export interface MountedComponent {
  /** Renders again with new props, keeping the React tree and its state. */
  update(props?: Record<string, unknown>): void;

  /** Takes the component down. */
  destroy(): void;
}

/**
 * Looks a page up by name, refusing one that is not registered.
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
 * Renders one page of this application inside a host's own page.
 *
 * It has no router and no route guards, only the providers it needs: the
 * translations, the query cache and the toaster.
 *
 * @param element - Where it renders. The host must not touch its contents.
 * @param options - Which page, and what to render it with.
 * @returns A handle for updating and taking it down.
 */
export function mountIreneComponent(
  element: HTMLElement,
  options: ComponentMountOptions
): MountedComponent {
  const Page = resolvePage(options.name);
  const Skeleton = findPageSkeleton(options.name) ?? PageSkeleton;

  applyEmbedConfig(options.config);
  linkStylesheet(options.version);

  element.dataset.reactRoot = '';

  const root: Root = createRoot(element);

  /* Given `onReady`, the host keeps its placeholder up, so Suspense is handed nothing to draw. */
  const { onReady } = options;
  const fallback = onReady ? null : createElement(Skeleton);

  const draw = (props?: Record<string, unknown>) => {
    const page = createElement(Page, props);

    const pageReportingReadiness = onReady ? createElement(ReadySignal, { onReady }, page) : page;

    const pageHeldUntilResolved = createElement(Suspense, { fallback }, pageReportingReadiness);
    const pageWithStoresFilled = createElement(ScreenContext, null, pageHeldUntilResolved);

    root.render(createElement(EmbedProviders, null, pageWithStoresFilled));
  };

  draw(options.props);

  return {
    update: draw,

    destroy() {
      /* Toasts are held in a module the host keeps loaded, and replayed to the next toaster. */
      akNotify.dismiss();

      /* Unmounting inside the host's own teardown warns, so it waits a tick. */
      setTimeout(() => root.unmount(), 0);
    },
  };
}
