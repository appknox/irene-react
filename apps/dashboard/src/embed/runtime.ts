/*
  What a host has to set up before any component of this app renders: where the
  API is, and the stylesheet the components are drawn with.
*/

/* Imported for the build: this is what puts the stylesheet in the output. */
import './styles/index.css';

declare global {
  var __IRENE_EMBED_CONFIG__: Record<string, string> | undefined;
}

/*
  Where the host serves this bundle's files from. Not a setting: the build
  bakes the same path into every chunk and font URL it emits, so moving the
  stylesheet alone would only half-work.
*/
const ASSET_BASE = '/assets/embed/';

/**
 * Records the configuration the host resolved, which this bundle reads in
 * place of values its own build would have frozen in.
 *
 * @param config - Every configuration key the host set, or nothing to leave it alone.
 */
export function applyEmbedConfig(config?: Record<string, string>) {
  if (config) {
    globalThis.__IRENE_EMBED_CONFIG__ = config;
  }
}

/**
 * Links the stylesheet once per document.
 *
 * Loaded as a file rather than bundled into this module, so the browser caches
 * it and the font URLs inside it resolve against the same directory.
 *
 * @param version - The host's build, so a new one is not served the last one's sheet.
 */
export function linkStylesheet(version?: string) {
  const query = version ? `?v=${version}` : '';
  const href = `${ASSET_BASE}style.css${query}`;

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = href;

  document.head.append(link);
}
