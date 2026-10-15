import { describe, expect, it } from 'vitest';
import { MERCER_DOWNLOAD_URL, PRODUCT_VERSIONS } from './product';

describe('MERCER_DOWNLOAD_URL', () => {
  it('is served over HTTPS, since it hands out an executable', () => {
    expect(new URL(MERCER_DOWNLOAD_URL).protocol).toBe('https:');
  });

  it('ends without a slash, so appending /<file> never doubles one', () => {
    expect(MERCER_DOWNLOAD_URL.endsWith('/')).toBe(false);
  });
});

describe('PRODUCT_VERSIONS', () => {
  it('names a release for each product the navigation shows a version for', () => {
    expect(Object.keys(PRODUCT_VERSIONS)).toEqual(['appknox', 'storeknox']);
  });
});
