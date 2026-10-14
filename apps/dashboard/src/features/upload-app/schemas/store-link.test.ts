import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { buildStoreLinkSchema } from './store-link';

/** What the schema says about a link, or nothing when it accepts it. */
const problemWith = (url: string) =>
  buildStoreLinkSchema().safeParse({ url }).error?.issues[0]?.message;

describe('buildStoreLinkSchema', () => {
  it.each([
    ['a play store listing', 'https://play.google.com/store/apps/details?id=com.appknox.mfva'],
    [
      'a play store listing with more asked of it',
      'https://play.google.com/store/apps/details?id=com.appknox.mfva&hl=en',
    ],
    ['an app store listing', 'https://apps.apple.com/in/app/appknox/id1234567890'],
    ['a link padded with spaces', '  https://apps.apple.com/in/app/appknox/id1234567890  '],
  ])('accepts %s', (_label, url) => {
    expect(problemWith(url)).toBeUndefined();
  });

  it('asks for a link when none has been given', () => {
    expect(problemWith('')).toBe(akMT('uploadAppModule.blankStoreLink'));
    expect(problemWith('   ')).toBe(akMT('uploadAppModule.blankStoreLink'));
  });

  it.each([
    ['text that is not a link', 'appknox.apk'],
    ['a link to somewhere else', 'https://appknox.com/download'],
    ['a store this client does not know', 'https://appgallery.huawei.com/app/C100'],
    [
      'a host that only looks like a store',
      'https://play.google.com.evil.test/store/apps/details?id=x',
    ],
  ])('rejects %s as a store it does not know', (_label, url) => {
    expect(problemWith(url)).toBe(akMT('uploadAppModule.unsupportedStoreLink'));
  });

  it.each([
    ['the store itself', 'https://play.google.com/store/apps'],
    ['a listing naming no app', 'https://play.google.com/store/apps/details'],
    ['a search rather than a listing', 'https://play.google.com/store/search?q=appknox'],
  ])('rejects %s on the play store', (_label, url) => {
    expect(problemWith(url)).toBe(akMT('uploadAppModule.invalidPlayStoreLink'));
  });

  it.each([
    ['the store itself', 'https://apps.apple.com/in/app'],
    ['a listing with no id', 'https://apps.apple.com/in/app/appknox'],
    ['a listing with no country', 'https://apps.apple.com/app/appknox/id1234567890'],
    ['an id that is not a number', 'https://apps.apple.com/in/app/appknox/idabc'],
  ])('rejects %s on the app store', (_label, url) => {
    expect(problemWith(url)).toBe(akMT('uploadAppModule.invalidAppStoreLink'));
  });
});
