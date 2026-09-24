import { describe, expect, it } from 'vitest';
import { returnPathFor, returnPathSchema } from '@/utils/login-return-path';

describe('returnPathSchema', () => {
  it('accepts a path within the app', () => {
    expect(returnPathSchema.parse('/dashboard/oidc/redirect?oidc_token=abc')).toBe(
      '/dashboard/oidc/redirect?oidc_token=abc'
    );
  });

  it('accepts an undefined value', () => {
    expect(returnPathSchema.parse(undefined)).toBeUndefined();
  });

  it.each([
    '//evil.example.test',
    'https://evil.example.test',
    'evil.example.test',
    'javascript:alert(1)',
  ])('drops %s, which would leave the app', (path) => {
    expect(returnPathSchema.parse(path)).toBeUndefined();
  });
});

describe('returnPathFor', () => {
  it('joins the pathname and the query string of the blocked location', () => {
    expect(
      returnPathFor({ pathname: '/dashboard/oidc/redirect', searchStr: '?oidc_token=abc' })
    ).toBe('/dashboard/oidc/redirect?oidc_token=abc');
  });

  it('returns the pathname alone when the location carries no query', () => {
    expect(returnPathFor({ pathname: '/projects', searchStr: '' })).toBe('/projects');
  });
});
