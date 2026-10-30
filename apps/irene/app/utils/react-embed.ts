/*
  The React side's bundle, fetched when a screen it draws is first opened.

  Loaded with a script tag rather than imported. An import by package name is
  rewritten by this app's build and lands in its own bundle, which every page
  then downloads — including the ones with no React on them at all. An import
  by URL would avoid that, but `ember-auto-import` rejects a dynamic relative
  import outright without Embroider. A tag is invisible to the build, so the
  bundle is fetched once, on the first screen that needs it.
*/

/** Where the bundle is served from, staged by `npm run build:embed`. */
const EMBED_URL = '/assets/embed/embed.js';

export interface EmbedComponentOptions {
  name: string;
  props?: Record<string, unknown>;
  config?: Record<string, string>;
}

export interface EmbedMountedComponent {
  update(props?: Record<string, unknown>): void;
  destroy(): void;
}

interface ReactEmbed {
  mountIreneComponent(
    element: HTMLElement,
    options: EmbedComponentOptions
  ): EmbedMountedComponent;
}

let pending: Promise<ReactEmbed> | undefined;

/**
 * Fetches the React side's bundle, once per page load.
 *
 * @returns What the bundle exports, shared by every caller.
 */
export function loadReactEmbed(): Promise<ReactEmbed> {
  pending ??= new Promise<ReactEmbed>((resolve, reject) => {
    const script = document.createElement('script');

    script.type = 'module';
    script.src = EMBED_URL;

    script.addEventListener('load', () => {
      const embed = (globalThis as Record<string, unknown>)['__ireneEmbed'];

      if (embed) {
        resolve(embed as ReactEmbed);
      } else {
        reject(new Error(`${EMBED_URL} loaded but published nothing`));
      }
    });

    script.addEventListener('error', () =>
      reject(new Error(`${EMBED_URL} could not be loaded`))
    );

    document.head.append(script);
  });

  return pending;
}
