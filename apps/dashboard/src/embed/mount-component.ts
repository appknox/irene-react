import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { HomePage } from '@/features/dashboard/pages/home';

import { EmbedProviders } from './providers';
import { applyEmbedConfig, DEFAULT_ASSET_BASE, linkStylesheet } from './runtime';
import { ScreenContext } from './screen-context';

/** What a component rendered this way may be handed. */
type EmbeddableComponent = ComponentType<Record<string, unknown>>;

/*
  The components a host may render by name.

  A screen is added here once it is migrated and a host wants it inside one of
  its own routes. That entry is the whole registration: nothing else changes on
  either side.
*/
const COMPONENTS: Record<string, EmbeddableComponent> = {
  HomePage,
};

export type IreneComponentName = string;

export interface ComponentMountOptions {
  /** Which component to render. */
  name: IreneComponentName;

  /** What to render it with. */
  props?: Record<string, unknown>;

  /** Build-time configuration the host resolved. */
  config?: Record<string, string>;

  /** Where the host serves this bundle's files from. */
  assetBase?: string;

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
 * Looks a component up by name.
 *
 * Refuses an unknown name rather than rendering nothing, so a typo in a host's
 * template fails where it is made instead of leaving an empty box behind.
 *
 * @param name - The name the host asked for.
 * @returns The component to render.
 */
function resolveComponent(name: string): EmbeddableComponent {
  const component = COMPONENTS[name];

  if (!component) {
    const known = Object.keys(COMPONENTS);

    throw new Error(
      `No embeddable component named "${name}". ` +
        (known.length > 0 ? `Known components: ${known.join(', ')}.` : 'None are registered yet.')
    );
  }

  return component;
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
  const Component = resolveComponent(options.name);

  applyEmbedConfig(options.config);
  linkStylesheet(options.assetBase ?? DEFAULT_ASSET_BASE, options.version);

  element.dataset.reactRoot = '';

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
