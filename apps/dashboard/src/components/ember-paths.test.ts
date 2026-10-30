import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { EMBER_PATHS, findEmberPath } from '@/components/ember-paths';

describe('findEmberPath', () => {
  it('answers the same path for a screen the Ember app serves under /dashboard', () => {
    expect(findEmberPath('/dashboard/marketplace')).toBe('/dashboard/marketplace');
    expect(findEmberPath('/dashboard/subscription')).toBe('/dashboard/subscription');
  });

  it('answers nothing for a screen this app has taken over', () => {
    expect(findEmberPath('/dashboard/billing')).toBeUndefined();
  });

  /* The Ember app serves the page and renders a React component inside it. */
  it('answers the same path for a screen embedded in an Ember page', () => {
    expect(findEmberPath('/dashboard/settings/general')).toBe('/dashboard/settings/general');
  });

  it('answers the same path where both apps agree on it', () => {
    expect(findEmberPath('/dashboard/privacy-module')).toBe('/dashboard/privacy-module');
    expect(findEmberPath('/partner/clients')).toBe('/partner/clients');
  });

  it('answers the Ember spelling where the two differ', () => {
    expect(findEmberPath('/security/download-app')).toBe('/security/downloadapp');
    expect(findEmberPath('/security/purge-analysis')).toBe('/security/purgeanalysis');
  });

  it('carries whatever follows the mapped path, which is how an id reaches Ember', () => {
    expect(findEmberPath('/dashboard/file/42')).toBe('/dashboard/file/42');
    expect(findEmberPath('/dashboard/file/42/analysis/7')).toBe('/dashboard/file/42/analysis/7');
  });

  it('takes the longest match, so one path is not read as a shorter one', () => {
    expect(findEmberPath('/dashboard/store-monitoring/42')).toBe('/dashboard/store-monitoring/42');

    expect(findEmberPath('/dashboard/store-release-readiness')).toBe(
      '/dashboard/store-release-readiness'
    );
  });

  it('answers nothing for a screen this app serves', () => {
    expect(findEmberPath('/dashboard/home')).toBeUndefined();
    expect(findEmberPath('/login')).toBeUndefined();
  });

  it('answers nothing for a path that only begins like a mapped one', () => {
    expect(findEmberPath('/dashboard/billing-history')).toBeUndefined();
  });
});

/*
  The Ember app keeps the mirror of this list: what it has handed over. A path
  claimed by both would send a navigation between the two apps without end, so
  its list is read here rather than trusted to stay in step by hand.
*/
describe('agreement with the Ember app', () => {
  const handback = readFileSync(
    resolve(import.meta.dirname, '../../../irene/app/instance-initializers/react-handback.ts'),
    'utf8'
  );

  const reactOwned = [
    ...(handback.match(/export const REACT_OWNED_PATHS = \[(.*?)\];/s)?.[1] ?? '').matchAll(
      /'([^']+)'/g
    ),
  ].map(([, path]) => path);

  it('reads the Ember app list, so a rename here fails rather than passes quietly', () => {
    expect(reactOwned.length).toBeGreaterThan(0);
  });

  it('claims no path the Ember app also serves, which would loop between them', () => {
    const emberOwned = Object.keys(EMBER_PATHS);

    const claimedByBoth = reactOwned.filter((path) =>
      emberOwned.some((owned) => path === owned || path.startsWith(`${owned}/`))
    );

    expect(claimedByBoth).toEqual([]);
  });

  it('hands back nothing the Ember app is the target of, which would loop the other way', () => {
    const emberTargets = Object.values(EMBER_PATHS);

    const handedBackToItself = reactOwned.filter((path) =>
      emberTargets.some((target) => target === path || target.startsWith(`${path}/`))
    );

    expect(handedBackToItself).toEqual([]);
  });
});
