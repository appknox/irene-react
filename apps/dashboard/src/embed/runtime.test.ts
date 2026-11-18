import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyEmbedConfig, DEFAULT_ASSET_BASE, linkStylesheet } from './runtime';

const globals = globalThis as Record<string, unknown>;

function stylesheets() {
  return [...document.querySelectorAll('link[rel="stylesheet"]')];
}

beforeEach(() => {
  for (const link of stylesheets()) {
    link.remove();
  }
});

afterEach(() => {
  delete globals['__IRENE_EMBED_CONFIG__'];
});

describe('applyEmbedConfig', () => {
  it('records what the host resolved, for the bundle to read instead of its own build', () => {
    applyEmbedConfig({ IRENE_API_HOST: 'https://api.example.com' });

    expect(globals['__IRENE_EMBED_CONFIG__']).toStrictEqual({
      IRENE_API_HOST: 'https://api.example.com',
    });
  });

  it('leaves an earlier one untouched when the host passes nothing', () => {
    applyEmbedConfig({ IRENE_API_HOST: 'https://api.example.com' });
    applyEmbedConfig(undefined);

    expect(globals['__IRENE_EMBED_CONFIG__']).toStrictEqual({
      IRENE_API_HOST: 'https://api.example.com',
    });
  });
});

describe('linkStylesheet', () => {
  it('links the sheet from where the host serves the bundle', () => {
    linkStylesheet(DEFAULT_ASSET_BASE);

    expect(stylesheets().map((link) => link.getAttribute('href'))).toStrictEqual([
      '/assets/embed/style.css',
    ]);
  });

  it('links it once, however many components mount', () => {
    linkStylesheet(DEFAULT_ASSET_BASE);
    linkStylesheet(DEFAULT_ASSET_BASE);
    linkStylesheet(DEFAULT_ASSET_BASE);

    expect(stylesheets()).toHaveLength(1);
  });

  it('carries the build, so a new one is not served the sheet of the last', () => {
    linkStylesheet(DEFAULT_ASSET_BASE, '25.12.4');

    expect(stylesheets()[0]?.getAttribute('href')).toBe('/assets/embed/style.css?v=25.12.4');
  });

  it('links again for a new build, since that is a different sheet', () => {
    linkStylesheet(DEFAULT_ASSET_BASE, '25.12.4');
    linkStylesheet(DEFAULT_ASSET_BASE, '25.12.5');

    expect(stylesheets()).toHaveLength(2);
  });

  it('honours a host that serves the bundle from somewhere else', () => {
    linkStylesheet('/static/irene-embed/');

    expect(stylesheets()[0]?.getAttribute('href')).toBe('/static/irene-embed/style.css');
  });
});
