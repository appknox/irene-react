import { describe, expect, it } from 'vitest';

import { EMBER_OWNED_PATHS } from './paths.ts';
import { emberProxy } from './proxy.ts';

describe('emberProxy', () => {
  it('forwards every path the Ember app owns', () => {
    const forwarded = Object.keys(emberProxy());

    for (const path of EMBER_OWNED_PATHS) {
      expect(forwarded).toContain(path);
    }
  });

  it('forwards the assets no React route will ever claim', () => {
    const forwarded = Object.keys(emberProxy());

    expect(forwarded).toEqual(
      expect.arrayContaining(['/assets', '/fonts', '/images', '/ak-icons.json'])
    );
  });

  it('forwards the live-reload channel, so a save still reloads the page', () => {
    const forwarded = Object.keys(emberProxy());

    expect(forwarded).toEqual(expect.arrayContaining(['/ember-cli-live-reload.js', '/_lr']));
  });

  it('sends everything to the Ember app’s own dev server', () => {
    for (const options of Object.values(emberProxy())) {
      expect(options).toStrictEqual({ target: 'http://localhost:4210', ws: true });
    }
  });

  it('claims nothing this app serves', () => {
    expect(Object.keys(emberProxy())).not.toContain('/dashboard/home');
  });
});
