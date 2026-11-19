import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { buildSkThirdPartyConfig } from '@tests/factories';

import {
  availableStores,
  hasThirdPartyScope,
  regionLabel,
  regionsByStore,
  resolveThirdPartyScope,
  riskStatusLabel,
  thirdPartyDetailsSearchSchema,
  thirdPartyListSearchSchema,
} from './third-party';

const { MINIMAL, MEDIUM, HIGH } = ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS;

const both = buildSkThirdPartyConfig({
  appstore_regions_opted: ['US', 'SG'],
  playstore_regions_opted: ['SA', 'US'],
});

const playOnly = buildSkThirdPartyConfig({
  appstore_regions_opted: [],
  playstore_regions_opted: ['SA', 'US'],
});

const nothing = buildSkThirdPartyConfig({
  appstore_regions_opted: [],
  playstore_regions_opted: [],
});

describe('regionsByStore and availableStores', () => {
  it('lists the opted regions of each store, none without a config', () => {
    expect(regionsByStore(both)).toEqual({ appstore: ['US', 'SG'], playstore: ['SA', 'US'] });
    expect(regionsByStore(null)).toEqual({ appstore: [], playstore: [] });
    expect(regionsByStore(undefined)).toEqual({ appstore: [], playstore: [] });
  });

  it('lists the stores with a region, App Store first', () => {
    expect(availableStores(both)).toEqual(['appstore', 'playstore']);
    expect(availableStores(playOnly)).toEqual(['playstore']);
    expect(availableStores(nothing)).toEqual([]);
  });

  it('reports a scope only when a store has a region', () => {
    expect(hasThirdPartyScope(both)).toBe(true);
    expect(hasThirdPartyScope(playOnly)).toBe(true);
    expect(hasThirdPartyScope(nothing)).toBe(false);
    expect(hasThirdPartyScope(undefined)).toBe(false);
  });
});

describe('resolveThirdPartyScope', () => {
  it('picks the asked store when it has regions, else the first store with regions, App Store first', () => {
    expect(resolveThirdPartyScope(both, { store: 'playstore' }).store).toBe('playstore');
    expect(resolveThirdPartyScope(both, {}).store).toBe('appstore');
    expect(resolveThirdPartyScope(playOnly, { store: 'appstore' }).store).toBe('playstore');
    expect(resolveThirdPartyScope(playOnly, {}).store).toBe('playstore');
  });

  it('falls back to Play Store with no region when nothing is opted', () => {
    expect(resolveThirdPartyScope(nothing, { store: 'appstore', region: 'US' })).toEqual({
      store: 'playstore',
      region: '',
    });

    expect(resolveThirdPartyScope(undefined, {})).toEqual({ store: 'playstore', region: '' });
  });

  it('keeps an opted region and replaces one the store did not opt into', () => {
    expect(resolveThirdPartyScope(both, { store: 'appstore', region: 'SG' }).region).toBe('SG');
    expect(resolveThirdPartyScope(both, { store: 'appstore', region: 'SA' }).region).toBe('US');
    expect(resolveThirdPartyScope(both, { store: 'playstore', region: '' }).region).toBe('SA');
    expect(resolveThirdPartyScope(both, {}).region).toBe('US');
  });
});

describe('thirdPartyListSearchSchema', () => {
  it('reads a garbage limit, store or risk status as unset', () => {
    const parsed = thirdPartyListSearchSchema.parse({
      tp_limit: 'many',
      tp_offset: '-4',
      tp_store: 'galaxy',
      tp_risk_status: '7',
      tp_filter: '   ',
    });

    expect(parsed).toEqual({});
  });

  it('reads an empty risk status as all', () => {
    expect(thirdPartyListSearchSchema.parse({ tp_risk_status: '' })).toEqual({});
  });

  it('keeps well-formed params, coercing the numbers and trimming the filter', () => {
    expect(
      thirdPartyListSearchSchema.parse({
        tp_limit: '25',
        tp_offset: '50',
        tp_store: 'playstore',
        tp_region: 'SA',
        tp_risk_status: '-1',
        tp_filter: '  bank ',
      })
    ).toEqual({
      tp_limit: 25,
      tp_offset: 50,
      tp_store: 'playstore',
      tp_region: 'SA',
      tp_risk_status: -1,
      tp_filter: 'bank',
    });
  });
});

describe('thirdPartyDetailsSearchSchema', () => {
  it('keeps a store, region and version, and drops an unknown store', () => {
    expect(
      thirdPartyDetailsSearchSchema.parse({
        tp_store: 'appstore',
        tp_region: 'US',
        tp_version: '1.2',
      })
    ).toEqual({ tp_store: 'appstore', tp_region: 'US', tp_version: '1.2' });

    expect(thirdPartyDetailsSearchSchema.parse({ tp_store: 'galaxy' })).toEqual({});
  });
});

describe('riskStatusLabel', () => {
  it('labels the three risk statuses and nothing else', () => {
    expect(riskStatusLabel(MINIMAL)).toBe('minimal');
    expect(riskStatusLabel(MEDIUM)).toBe('medium');
    expect(riskStatusLabel(HIGH)).toBe('high');
    expect(riskStatusLabel(3)).toBeNull();
    expect(riskStatusLabel(-1)).toBeNull();
  });
});

describe('regionLabel', () => {
  it('names a known region and shows an unknown code as it is', () => {
    expect(regionLabel('US')).toBe(akMT('storeknox.regionNames.US'));
    expect(regionLabel('ZZ')).toBe('ZZ');
  });
});
