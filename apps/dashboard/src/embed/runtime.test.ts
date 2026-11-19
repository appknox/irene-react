import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyEmbedConfig, linkStylesheet } from './runtime';

function stylesheets() {
  return [...document.querySelectorAll('link[rel="stylesheet"]')];
}

beforeEach(() => {
  for (const link of stylesheets()) {
    link.remove();
  }
});

afterEach(() => {
  delete globalThis.__IRENE_EMBED_CONFIG__;
});

describe('applyEmbedConfig', () => {
  it('records what the host resolved, for the bundle to read instead of its own build', () => {
    applyEmbedConfig({ IRENE_API_HOST: 'https://api.example.com' });

    expect(globalThis.__IRENE_EMBED_CONFIG__).toStrictEqual({
      IRENE_API_HOST: 'https://api.example.com',
    });
  });

  it('leaves an earlier one untouched when the host passes nothing', () => {
    applyEmbedConfig({ IRENE_API_HOST: 'https://api.example.com' });
    applyEmbedConfig(undefined);

    expect(globalThis.__IRENE_EMBED_CONFIG__).toStrictEqual({
      IRENE_API_HOST: 'https://api.example.com',
    });
  });
});

describe('linkStylesheet', () => {
  it('links the sheet from where the host serves the bundle', () => {
    linkStylesheet();

    expect(stylesheets().map((link) => link.getAttribute('href'))).toStrictEqual([
      '/assets/embed/style.css',
    ]);
  });

  it('links it once, however many components mount', () => {
    linkStylesheet();
    linkStylesheet();
    linkStylesheet();

    expect(stylesheets()).toHaveLength(1);
  });

  it('carries the build, so a new one is not served the sheet of the last', () => {
    linkStylesheet('25.12.4');

    expect(stylesheets()[0]?.getAttribute('href')).toBe('/assets/embed/style.css?v=25.12.4');
  });

  it('links again for a new build, since that is a different sheet', () => {
    linkStylesheet('25.12.4');
    linkStylesheet('25.12.5');

    expect(stylesheets()).toHaveLength(2);
  });

  it('links it from where the build emits the rest of the bundle', () => {
    linkStylesheet();

    expect(stylesheets()[0]?.getAttribute('href')).toBe('/assets/embed/style.css');
  });
});
