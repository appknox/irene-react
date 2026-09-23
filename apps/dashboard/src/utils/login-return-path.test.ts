import { describe, expect, it } from 'vitest';
import { returnPathFor, returnPathSchema } from '@/utils/login-return-path';

describe('returnPathSchema', () => {
  it('accepts a path inside the app', () => {
    expect(returnPathSchema.parse('/dashboard/oidc/redirect?oidc_token=abc')).toBe(
      '/dashboard/oidc/redirect?oidc_token=abc'
    );
  });

  it('accepts nothing at all', () => {
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
  it('joins the path and the query the guard interrupted', () => {
    expect(
      returnPathFor({ pathname: '/dashboard/oidc/redirect', searchStr: '?oidc_token=abc' })
    ).toBe('/dashboard/oidc/redirect?oidc_token=abc');
  });

  it('returns the path alone when there is no query', () => {
    expect(returnPathFor({ pathname: '/projects', searchStr: '' })).toBe('/projects');
  });
});
