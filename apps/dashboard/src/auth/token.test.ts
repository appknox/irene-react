import { describe, expect, it } from 'vitest';

import { b64EncodeUnicode, getB64Token } from '@/auth/token';

describe('b64EncodeUnicode', () => {
  it('encodes plain ascii', () => {
    expect(b64EncodeUnicode('1:abc')).toBe('MTphYmM=');
  });

  /**
   * The expected values come from the Ember implementation, so a token minted
   * by either app is accepted by the backend unchanged.
   */
  it.each([
    ['7:пароль', 'NzrQv9Cw0YDQvtC70Yw='],
    ['9:日本語-token', 'OTrml6XmnKzoqp4tdG9rZW4='],
    ['3:café', 'MzpjYWbDqQ=='],
  ])('encodes %s beyond latin1', (input, expected) => {
    expect(b64EncodeUnicode(input)).toBe(expected);
  });

  it('encodes an empty string', () => {
    expect(b64EncodeUnicode('')).toBe('');
  });
});

describe('getB64Token', () => {
  it('joins the user id and token with a colon', () => {
    expect(getB64Token(42, 'tok3n')).toBe('NDI6dG9rM24=');
  });

  it('matches a hand-built credential', () => {
    expect(getB64Token(1, 'abc')).toBe(b64EncodeUnicode('1:abc'));
  });
});
