import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { sbomComponentNameWithoutRegistry, storeNameForUrl } from './utils';

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
