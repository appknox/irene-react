/*
  What a host has to set up before any screen of this app renders: where the
  API is, and the stylesheet the components are drawn with.
*/

/* Imported for the build: this is what puts the stylesheet in the output. */
import './styles/index.css';

/** Matches the base the bundle was built with, which its font URLs resolve against. */
export const DEFAULT_ASSET_BASE = '/assets/embed/';

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

/**
 * Links the stylesheet once per document.
 *
 * Loaded as a file rather than bundled into this module, so the browser caches
 * it and the font URLs inside it resolve against the same directory.
 *
 * @param assetBase - Where the host serves this bundle's files from.
 */
export function linkStylesheet(assetBase: string) {
  const href = `${assetBase}style.css`;

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = href;

  document.head.append(link);
}
