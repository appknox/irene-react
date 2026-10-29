import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { offerHandedOverResponses } from '@irene/api/utils/response-handoff';

import { AnalyticsPage } from '@/features/dashboard/pages/analytics';

import { AccountSettings } from './components/account-settings';
import { EmbedProviders } from './providers';
import { applyEmbedConfig, DEFAULT_ASSET_BASE, linkStylesheet } from './runtime';
import { ScreenContext } from './screen-context';

/** The components a host may render by name. */
const COMPONENTS = {
  AnalyticsPage,
  AccountSettings,
} as const;

export type IreneComponentName = keyof typeof COMPONENTS;

export interface ComponentMountOptions {
  /** Which component to render. */
  name: IreneComponentName;

  /** What to render it with. */
  props?: Record<string, unknown>;

  /** Build-time configuration the host resolved. */
  config?: Record<string, string>;

  /** Where the host serves this bundle's files from. */
  assetBase?: string;

  /**
   * Responses the host has already fetched, by request path. Each is used
   * once, which spares the second round of requests as a session begins.
   */
  responses?: Record<string, unknown>;
}

export interface MountedComponent {
  /** Renders again with new props, keeping the React tree and its state. */
  update(props?: Record<string, unknown>): void;

  /** Takes the component down. */
  destroy(): void;
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
  applyEmbedConfig(options.config);
  linkStylesheet(options.assetBase ?? DEFAULT_ASSET_BASE);

  if (options.responses) {
    offerHandedOverResponses(options.responses);
  }

  element.dataset.reactRoot = '';

  const Component = COMPONENTS[options.name];
  const root: Root = createRoot(element);

  /*
    The context goes inside the providers and around the screen: a screen reads
    the organization from a store the signed-in routes fill, and no route runs
    here.
  */
  const draw = (props?: Record<string, unknown>) =>
    root.render(
      createElement(
        EmbedProviders,
        null,
        createElement(ScreenContext, null, createElement(Component, props))
      )
    );

  draw(options.props);

  return {
    update: draw,

    destroy() {
      /* Unmounting inside the host's own teardown warns, so it waits a tick. */
      setTimeout(() => root.unmount(), 0);
    },
  };
}
