import {
  createMemoryHistory,
  createRouter,
  Outlet,
  type AnyRouter,
} from '@tanstack/react-router';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { queryClient } from '@irene/api';
import { offerHandedOverResponses } from '@irene/api/utils/response-handoff';

import { IRENE_DASHBOARD_ROUTER_DEFAULTS } from '@/router';
import { IrenePage } from './irene-page';
import './styles/index.css';

/** How the host is told about a link the embedded page wants to follow. */
type NavigateHandler = (path: string) => void;

export interface MountOptions {
  /** The page to render. Defaults to the host's current URL. */
  path?: string;

  /**
   * Called for a link inside the page, so the host's router handles it.
   * Without one, the browser loads the href as a document.
   */
  onNavigate?: NavigateHandler;

  /**
   * Build-time configuration, which a host already holds. Read at mount rather
   * than frozen into this bundle, so an installation that injects its own
   * configuration still reaches these pages.
   */
  config?: Record<string, string>;

  /** Where the host serves this bundle's files from. */
  assetBase?: string;

  /**
   * Whether these pages draw their own navigation. Pass false where the host
   * already draws it, so crossing between a host page and one of these swaps
   * the content and leaves the surrounding frame where it is.
   */
  chrome?: boolean;

  /**
   * Responses the host has already fetched, by request path. Both
   * applications load the same endpoints as a session begins, and these spare
   * the second round of requests. Each is used once.
   */
  responses?: Record<string, unknown>;
}

/** Matches the base the bundle was built with, which its font URLs resolve against. */
const DEFAULT_ASSET_BASE = '/assets/embed/';

/**
 * Links the stylesheet once per document.
 *
 * Loaded as a file rather than bundled into this module, so the browser caches
 * it and the font URLs inside it resolve against the same directory.
 *
 * @param assetBase - Where the host serves this bundle's files from.
 */
function linkStylesheet(assetBase: string) {
  const href = `${assetBase}style.css`;

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = href;

  document.head.append(link);
}

export interface MountedPage {
  /** Renders again with new options, keeping the React tree and its state. */
  update(options: MountOptions): void;

  /** Takes the page down and releases what it registered. */
  destroy(): void;
}

/**
 * Records the configuration the host resolved, which this bundle reads in
 * place of values its own build would have frozen in.
 *
 * @param config - Every configuration key the host set, or nothing to leave it alone.
 */
export function applyEmbedConfig(config?: Record<string, string>) {
  if (config) {
    (globalThis as Record<string, unknown>)['__IRENE_EMBED_CONFIG__'] = config;
  }
}

/* The route whose only job is to draw this application's navigation. */
const CHROME_ROUTE_ID = '/_authenticated/dashboard';

/**
 * Turns this application's navigation into a pass-through.
 *
 * The chrome is a route, not a component a page renders, so it cannot be left
 * out by choosing a different entry — the page below it would lose its place
 * in the tree, and a finished page is bound to its route. Replacing what that
 * route renders keeps the tree intact and draws nothing.
 *
 * @param router - The router about to be rendered.
 */
function suppressChrome(router: AnyRouter) {
  const route = router.routesById[CHROME_ROUTE_ID];

  if (route) {
    route.options.component = Outlet;
  }
}

/** Whether a click asked for this document, rather than a new tab or a download. */
function isPlainClick(event: MouseEvent) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * Mounts a page of this application inside a host that owns the page.
 *
 * Everything the host would otherwise write is here: the React root, the
 * stylesheet, and the bridge that hands links back to the host's router. A
 * host needs an element and this function.
 *
 * @param element - Where the page renders. The host must not touch its contents.
 * @param options - What to render and how to hand navigation back.
 * @returns A handle for updating and taking down the page.
 */
export function mountIrenePage(element: HTMLElement, options: MountOptions = {}): MountedPage {
  applyEmbedConfig(options.config);

  linkStylesheet(options.assetBase ?? DEFAULT_ASSET_BASE);

  if (options.responses) {
    offerHandedOverResponses(options.responses);
  }

  /* Marks the subtree for the base styles, which are scoped to it. */
  element.dataset.reactRoot = '';

  let onNavigate = options.onNavigate;

  /*
    Capture phase, so a link is claimed before the page's own router follows
    it. The router subscription below reports navigation this router performs
    itself; a link has to be caught here as well, because the host owns the
    address bar and only it can change what the document is showing.
  */
  const claimLink = (event: MouseEvent) => {
    if (!isPlainClick(event)) {
      return;
    }

    const anchor = (event.target as Element | null)?.closest?.('a[href]');
    const href = anchor?.getAttribute('href');

    /* Off-origin links, downloads and new tabs stay the browser's. */
    if (!href || !href.startsWith('/') || anchor?.getAttribute('target') === '_blank') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.assign(href);
    }
  };

  element.addEventListener('click', claimLink as EventListener, true);

  const startedAt = options.path ?? `${window.location.pathname}${window.location.search}`;

  const router = createRouter({
    ...IRENE_DASHBOARD_ROUTER_DEFAULTS,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [startedAt] }),
  });

  if (options.chrome === false) {
    suppressChrome(router);
  }

  /*
    A page that navigates rather than renders — an SSO callback trading a token
    for a session, a guard sending a signed-out visitor to the login page —
    moves this router, which the address bar knows nothing about. The host is
    told so its own router can follow.
  */
  const unsubscribe = router.subscribe('onResolved', ({ toLocation }) => {
    if (toLocation.href !== startedAt) {
      onNavigate?.(toLocation.href);
    }
  });

  const root: Root = createRoot(element);

  root.render(createElement(IrenePage, { router }));

  return {
    update(next: MountOptions) {
      onNavigate = next.onNavigate ?? onNavigate;

      if (next.path && next.path !== router.state.location.href) {
        router.navigate({ href: next.path, replace: true });
      }
    },

    destroy() {
      unsubscribe();
      element.removeEventListener('click', claimLink as EventListener, true);

      /* Unmounting inside the host's own teardown warns, so it waits a tick. */
      setTimeout(() => root.unmount(), 0);
    },
  };
}
