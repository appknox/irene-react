import { describe, expect, it } from 'vitest';

import { isWebUrl } from '@/utils/web-url';

describe('isWebUrl', () => {
  it('accepts http and https links only', () => {
    expect(isWebUrl('https://example.com/report.xlsx')).toBe(true);
    expect(isWebUrl('http://example.com/report.xlsx')).toBe(true);
    expect(isWebUrl('javascript:alert(1)')).toBe(false);
    expect(isWebUrl('data:text/html,hi')).toBe(false);
    expect(isWebUrl('not a url')).toBe(false);
  });
});
