import { describe, expect, it } from 'vitest';
import { chooseIndex } from './splunk-targets';

describe('chooseIndex', () => {
  it('keeps the chosen index while the instance has not answered', () => {
    expect(chooseIndex('findings', [], 0)).toBe('findings');
  });

  it('keeps an index the instance still holds', () => {
    expect(chooseIndex('findings', ['logs', 'findings'], 0)).toBe('findings');
  });

  it('falls back to the index at its own position for one that is gone', () => {
    expect(chooseIndex('gone', ['logs', 'findings'], 1)).toBe('findings');
  });

  it('falls back to the first index where there is no second', () => {
    expect(chooseIndex('gone', ['logs'], 1)).toBe('logs');
  });
});
