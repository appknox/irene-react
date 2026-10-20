import { describe, expect, it } from 'vitest';
import { getCSSVariableValue } from '@irene/ui/css-variable';

describe('getCSSVariableValue', () => {
  it('falls back where the document holds no value for the variable', () => {
    expect(getCSSVariableValue('--not-a-token', '#123456')).toBe('#123456');
  });

  it('reads the value the document holds', () => {
    document.documentElement.style.setProperty('--a-test-token', '#abcdef');

    expect(getCSSVariableValue('--a-test-token', '#000000')).toBe('#abcdef');
  });
});
