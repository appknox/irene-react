import { describe, expect, it } from 'vitest';
import { iconNamesBySet, iconSets } from './sets';

describe('the icon sets', () => {
  it('lists each icon name once per set', () => {
    for (const [set, names] of Object.entries(iconSets)) {
      expect({ set, duplicates: names.length - new Set(names).size }).toEqual({
        set,
        duplicates: 0,
      });
    }
  });

  it('prefixes every name with its set', () => {
    for (const [set, names] of Object.entries(iconNamesBySet)) {
      const misprefixed = names.filter((name) => !name.startsWith(`${set}:`));

      expect({ set, misprefixed }).toEqual({ set, misprefixed: [] });
    }
  });

  it('keeps the grouped names in step with the lists they are built from', () => {
    for (const [set, names] of Object.entries(iconSets)) {
      expect({ set, count: iconNamesBySet[set as keyof typeof iconSets].length }).toEqual({
        set,
        count: names.length,
      });
    }
  });
});
