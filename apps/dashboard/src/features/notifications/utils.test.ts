import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import {
  formatExpiryDate,
  formatNotificationDate,
  sbomComponentNameWithoutRegistry,
  storeNameForUrl,
} from './utils';

describe('storeNameForUrl', () => {
  it('names the Play Store for a Google listing', () => {
    expect(storeNameForUrl('https://play.google.com/store/apps/details?id=com.app')).toBe(
      akMT('googlePlayStore')
    );
  });

  it('names the App Store for an Apple listing', () => {
    expect(storeNameForUrl('https://apps.apple.com/us/app/id123')).toBe(akMT('appleAppStore'));
  });

  it('names a store generically for a host neither store serves', () => {
    expect(storeNameForUrl('https://appgallery.huawei.com/app/1')).toBe(akMT('storeLowercase'));
  });

  it('names a store generically for a listing that is not a URL', () => {
    expect(storeNameForUrl('not-a-url')).toBe(akMT('storeLowercase'));
  });
});

describe('formatNotificationDate', () => {
  it('writes the date out in full', () => {
    expect(formatNotificationDate('2026-10-01T12:23:17.587707Z')).toBe('1 October 2026');
  });

  it('returns nothing for a date it cannot read', () => {
    expect(formatNotificationDate('not-a-date')).toBe('');
  });

  it('returns nothing for a date the notification left empty', () => {
    expect(formatNotificationDate('')).toBe('');
  });
});

describe('formatExpiryDate', () => {
  it('shortens the date', () => {
    expect(formatExpiryDate('2026-10-01T12:23:17.587707Z')).toBe('Oct 1, 2026');
  });

  it('returns nothing for a date it cannot read', () => {
    expect(formatExpiryDate('not-a-date')).toBe('');
  });
});

describe('sbomComponentNameWithoutRegistry', () => {
  it('takes the plain name the notification carries', () => {
    expect(sbomComponentNameWithoutRegistry('lodash', 'npm::lodash')).toBe('lodash');
  });

  it('drops the registry when the notification carries no plain name', () => {
    expect(sbomComponentNameWithoutRegistry('', 'npm::lodash')).toBe('lodash');
  });

  it('keeps the whole name when it carries no registry either', () => {
    expect(sbomComponentNameWithoutRegistry('', 'lodash')).toBe('lodash');
  });
});
