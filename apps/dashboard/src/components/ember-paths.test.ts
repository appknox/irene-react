import { describe, expect, it } from 'vitest';
import { EMBER_OWNED_PATHS, EMBER_PATHS, findEmberPath } from './ember-paths';

describe('findEmberPath', () => {
  it('maps a path the Ember app still owns', () => {
    expect(findEmberPath('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('returns nothing for a path this app serves', () => {
    expect(findEmberPath('/dashboard/home')).toBeUndefined();
  });

  it('carries the rest of the path across, so ids reach the Ember app', () => {
    expect(findEmberPath('/dashboard/file/42/analysis/7')).toBe('/dashboard/file/42/analysis/7');
  });

  it('translates a path the two apps spell differently', () => {
    expect(findEmberPath('/security/download-app')).toBe('/security/downloadapp');
    expect(findEmberPath('/security/purge-analysis')).toBe('/security/purgeanalysis');
  });

  it('does not claim a sibling that merely starts with an owned path', () => {
    expect(findEmberPath('/dashboard/projects-overview')).toBeUndefined();
  });

  it('leaves a migrated page alone while owning the pages under it', () => {
    expect(findEmberPath('/dashboard/storeknox')).toBeUndefined();
    expect(findEmberPath('/dashboard/storeknox/fake-apps')).toBe('/dashboard/storeknox/fake-apps');
  });

  it('prefers the longest owner, so a deeper path is not read as a shallower one', () => {
    expect(findEmberPath('/dashboard/reports')).toBeUndefined();
    expect(findEmberPath('/dashboard/reports/generate')).toBe('/dashboard/reports/generate');
  });
});

describe('EMBER_OWNED_PATHS', () => {
  it('holds every destination in the ledger, without repeats', () => {
    expect([...EMBER_OWNED_PATHS].sort()).toStrictEqual(
      [...new Set(Object.values(EMBER_PATHS))].sort()
    );
  });

  it('is ordered longest first, so the most specific owner is tested first', () => {
    const lengths = EMBER_OWNED_PATHS.map((path) => path.length);

    expect(lengths).toStrictEqual([...lengths].sort((one, other) => other - one));
  });

  it('lists only absolute paths with no trailing slash', () => {
    for (const path of EMBER_OWNED_PATHS) {
      expect(path.startsWith('/')).toBe(true);
      expect(path.endsWith('/')).toBe(false);
    }
  });
});
