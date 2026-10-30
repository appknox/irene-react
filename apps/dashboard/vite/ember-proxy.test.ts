import { describe, expect, it } from 'vitest';

import { EMBER_OWNED_PATHS, EMBER_PATHS } from '../src/components/ember-paths';
import { emberProxy } from './ember-proxy';

const proxy = emberProxy();
const proxied = Object.keys(proxy);

/** Whether the dev server hands this path to the Ember app. */
const isProxied = (path: string) =>
  proxied.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

describe('emberProxy', () => {
  it('hands over every path the Ember app still serves', () => {
    const missed = EMBER_OWNED_PATHS.filter((path) => !isProxied(path));

    expect(missed).toEqual([]);
  });

  /*
    An Ember page loads its own bundles, fonts and icons by these paths. Without
    them the document arrives and renders nothing, which is a blank page rather
    than an error.
  */
  it('hands over the files an Ember page loads', () => {
    for (const path of ['/assets/vendor.js', '/assets/embed/embed.js', '/fonts/x.woff2']) {
      expect(isProxied(path), path).toBe(true);
    }

    expect(isProxied('/ak-icons.json')).toBe(true);
  });

  it('keeps the live-reload channel, so the Ember server can still rebuild the page', () => {
    expect(isProxied('/ember-cli-live-reload.js')).toBe(true);
    expect(proxy['/_lr']?.ws).toBe(true);
  });

  it('leaves this app the paths it serves itself', () => {
    for (const path of ['/', '/login', '/dashboard/home', '/dashboard/billing']) {
      expect(isProxied(path), path).toBe(false);
    }
  });

  it('sends everything to one target, so a move needs one edit', () => {
    const targets = new Set(Object.values(proxy).map((entry) => entry.target));

    expect([...targets]).toEqual(['http://localhost:4210']);
  });

  it('carries websockets on every entry, which the dev server needs', () => {
    const withoutSockets = Object.entries(proxy).filter(([, entry]) => !entry.ws);

    expect(withoutSockets.map(([path]) => path)).toEqual([]);
  });

  it('follows the ledger, so migrating a screen is one deletion', () => {
    expect(isProxied('/dashboard/projects')).toBe(true);
    expect(EMBER_PATHS['/dashboard/projects']).toBe('/dashboard/projects');
  });
});
