import { describe, expect, it } from 'vitest';
import { findMessageArguments } from './message-arguments.ts';

describe('findMessageArguments', () => {
  it('lists plain arguments as taking any value', () => {
    expect(findMessageArguments({ a: '{shown} of {total}' })).toEqual([
      [
        'a',
        [
          ['shown', 'value'],
          ['total', 'value'],
        ],
      ],
    ]);
  });

  it('marks plural arguments as numbers', () => {
    expect(findMessageArguments({ a: '{count, plural, one {# file} other {# files}}' })).toEqual([
      ['a', [['count', 'number']]],
    ]);
  });

  it('keeps a number when the same argument is also printed plainly', () => {
    expect(findMessageArguments({ a: '{count} — {count, plural, other {#}}' })).toEqual([
      ['a', [['count', 'number']]],
    ]);
  });

  it('reads arguments inside select options, plural options and tags', () => {
    expect(
      findMessageArguments({
        a: '{kind, select, app {<b>{name}</b>} other {{count, plural, other {# items}}}}',
      })
    ).toEqual([
      [
        'a',
        [
          ['count', 'number'],
          ['kind', 'value'],
          ['name', 'value'],
        ],
      ],
    ]);
  });

  it('leaves out messages without arguments', () => {
    expect(
      findMessageArguments({ plain: 'Login', tagged: '<b>Bold</b>', escaped: "'{'x'}'" })
    ).toEqual([]);
  });

  it('sorts ids and argument names', () => {
    expect(findMessageArguments({ z: '{b} {a}', a: '{x}' })).toEqual([
      ['a', [['x', 'value']]],
      [
        'z',
        [
          ['a', 'value'],
          ['b', 'value'],
        ],
      ],
    ]);
  });
});
