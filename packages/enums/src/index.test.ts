import { describe, expect, expectTypeOf, it } from 'vitest';
import { ENUMS, ENUMS_DISPLAY, UNKNOWN } from '@irene/enums';

const groups = Object.entries(ENUMS);

describe('ENUMS', () => {
  it('carries all 80 groups and 332 declared keys', () => {
    expect(groups).toHaveLength(80);

    const declared = groups.reduce((total, [, group]) => total + group.BASE_CHOICES.length, 0);

    expect(declared).toBe(332);
  });

  it('gives every group the derived extras', () => {
    const missing = groups
      .filter(([, g]) => !('UNKNOWN' in g && 'CHOICES' in g && 'VALUES' in g))
      .map(([name]) => name);

    expect(missing).toEqual([]);
  });

  it.each([
    ['PRODUCT', ENUMS.PRODUCT.APPKNOX, 0],
    ['MFA_METHOD', ENUMS.MFA_METHOD.HOTP, 2],
    ['RISK', ENUMS.RISK.CRITICAL, 4],
    ['RISK.UNKNOWN', ENUMS.RISK.UNKNOWN, -1],
  ])('%s matches irene', (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it("keeps each module's groups distinct", () => {
    expect(ENUMS.SK_APP_STATUS).toBeDefined();
    expect(ENUMS.PM_STATUS).toBeDefined();
    expect(ENUMS.KNOXIQ_SCAN_STATUS).toBeDefined();
    expect(ENUMS.AI_REPORTING_FIELD_TYPE).toBeDefined();
    expect(ENUMS.STORE_RELEASE_VERDICT).toBeDefined();
  });
});

describe('derived extras', () => {
  it('builds CHOICES from the declared entries plus UNKNOWN', () => {
    expect(ENUMS.PRODUCT.CHOICES).toEqual([
      { key: 'APPKNOX', value: 0 },
      { key: 'DEVKNOX', value: 1 },
      { key: 'UNKNOWN', value: UNKNOWN },
    ]);
  });

  it('leaves UNKNOWN out of BASE_CHOICES', () => {
    expect(ENUMS.PRODUCT.BASE_CHOICES).toEqual([
      { key: 'APPKNOX', value: 0 },
      { key: 'DEVKNOX', value: 1 },
    ]);
  });

  it('mirrors the choices in VALUES', () => {
    expect(ENUMS.PRODUCT.VALUES).toEqual([0, 1, UNKNOWN]);
    expect(ENUMS.PRODUCT.BASE_VALUES).toEqual([0, 1]);
  });
});

describe('types', () => {
  it('keeps literal values, not widened numbers', () => {
    expectTypeOf(ENUMS.RISK.CRITICAL).toEqualTypeOf<4>();
    expectTypeOf(ENUMS.PRODUCT.APPKNOX).toEqualTypeOf<0>();
    expectTypeOf(ENUMS.ANALYSIS_OVERRIDE_CRITERIA.CURRENT_FILE).toEqualTypeOf<'current_file'>();
  });

  it('types the derived extras', () => {
    expectTypeOf(ENUMS.RISK.UNKNOWN).toEqualTypeOf<-1>();
    expectTypeOf(ENUMS.RISK.BASE_VALUES).toEqualTypeOf<(0 | 1 | 2 | 3 | 4)[]>();
  });
});

describe('ENUMS_DISPLAY', () => {
  it('names the platforms', () => {
    expect(ENUMS_DISPLAY.PLATFORM[ENUMS.PLATFORM.IOS]).toBe('iOS');

    expect(ENUMS_DISPLAY.SBOM_COMPONENT_TYPE_NAMES[ENUMS.SBOM_COMPONENT_TYPE.LIBRARY]).toBe(
      'library'
    );
  });
});
