import { describe, expect, it } from 'vitest';
import { findEmberPath } from '@/components/ember-paths';

describe('findEmberPath', () => {
  it('answers the Ember path for a screen that moved under /dashboard', () => {
    expect(findEmberPath('/dashboard/marketplace')).toBe('/marketplace');
    expect(findEmberPath('/dashboard/subscription')).toBe('/subscription');
  });

  it('answers nothing for a screen this app has taken over', () => {
    expect(findEmberPath('/dashboard/billing')).toBeUndefined();
    expect(findEmberPath('/dashboard/settings/general')).toBeUndefined();
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
    expect(findEmberPath('/dashboard/file/42')).toBe('/file/42');
    expect(findEmberPath('/dashboard/file/42/analysis/7')).toBe('/file/42/analysis/7');
  });

  it('takes the longest match, so one path is not read as a shorter one', () => {
    expect(findEmberPath('/dashboard/store-monitoring/42')).toBe('/store-monitoring/42');
    expect(findEmberPath('/dashboard/store-release-readiness')).toBe('/store-release-readiness');
  });

  it('answers nothing for a screen this app serves', () => {
    expect(findEmberPath('/dashboard/home')).toBeUndefined();
    expect(findEmberPath('/login')).toBeUndefined();
  });

  it('answers nothing for a path that only begins like a mapped one', () => {
    expect(findEmberPath('/dashboard/billing-history')).toBeUndefined();
  });
});
