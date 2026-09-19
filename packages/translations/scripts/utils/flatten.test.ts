import { describe, expect, it } from 'vitest';
import { closeLineBreaks, flattenMessages } from './flatten';

describe('closeLineBreaks', () => {
  it.each([
    ['<br>', 'a<br>b'],
    ['<br/>', 'a<br/>b'],
    ['<br />', 'a<br />b'],
    ['<BR>', 'a<BR>b'],
  ])('closes %s', (_, message) => {
    expect(closeLineBreaks(message)).toBe('a<br></br>b');
  });

  it('closes every line break in a message', () => {
    expect(closeLineBreaks('a<br>b<br/>c')).toBe('a<br></br>b<br></br>c');
  });

  it('leaves other tags and already closed breaks alone', () => {
    expect(closeLineBreaks('<strong>a</strong><br></br>')).toBe('<strong>a</strong><br></br>');
  });
});

describe('flattenMessages', () => {
  it('keeps top-level messages under their own key', () => {
    expect(flattenMessages({ login: 'Login' })).toEqual({ login: 'Login' });
  });

  it('joins nested keys with dots at any depth', () => {
    expect(flattenMessages({ a: { b: { c: { d: 'deep' } }, e: 'shallow' } })).toEqual({
      'a.b.c.d': 'deep',
      'a.e': 'shallow',
    });
  });

  it('keys array items by index', () => {
    expect(flattenMessages({ steps: ['one', 'two'] })).toEqual({
      'steps.0': 'one',
      'steps.1': 'two',
    });
  });

  it('closes line breaks while flattening', () => {
    expect(flattenMessages({ a: { b: 'x<br>y' }, list: ['p<br/>q'] })).toEqual({
      'a.b': 'x<br></br>y',
      'list.0': 'p<br></br>q',
    });
  });

  it('returns nothing for an empty file', () => {
    expect(flattenMessages({})).toEqual({});
  });
});
