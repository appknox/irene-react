import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { buildPlan, buildSubscription } from '@tests/factories';

import {
  formatBillingDate,
  getBillingPeriodLabel,
  getDurationLabel,
  getPlanPricing,
  isWebUrl,
  PAYMENT_DURATIONS,
} from './utils';

describe('getPlanPricing', () => {
  it('takes each period’s own price and checkout link', () => {
    const plan = buildPlan();

    expect(getPlanPricing(plan, ENUMS.PAYMENT_DURATION.MONTHLY)).toEqual({
      price: plan.monthly_price,
      url: plan.monthly_url,
    });

    expect(getPlanPricing(plan, ENUMS.PAYMENT_DURATION.QUARTERLY)).toEqual({
      price: plan.quarterly_price,
      url: plan.quarterly_url,
    });

    expect(getPlanPricing(plan, ENUMS.PAYMENT_DURATION.HALFYEARLY)).toEqual({
      price: plan.half_yearly_price,
      url: plan.half_yearly_url,
    });

    expect(getPlanPricing(plan, ENUMS.PAYMENT_DURATION.YEARLY)).toEqual({
      price: plan.yearly_price,
      url: plan.yearly_url,
    });
  });
});

describe('getDurationLabel', () => {
  it('names every period irene offers, in irene’s order', () => {
    expect(PAYMENT_DURATIONS.map(getDurationLabel)).toEqual([
      akMT('monthly'),
      akMT('quarterly'),
      akMT('halfYearly'),
      akMT('yearly'),
    ]);
  });
});

describe('getBillingPeriodLabel', () => {
  it('counts years', () => {
    expect(
      getBillingPeriodLabel(buildSubscription({ billing_period: '1', billing_period_unit: 'Year' }))
    ).toBe(akMT('yearWithNum', { numYears: 1 }));
  });

  it('shows a unit it does not know as the server sent it', () => {
    const subscription = buildSubscription({ billing_period_unit: 'week' });

    expect(getBillingPeriodLabel(subscription)).toBe(subscription.billing_period_unit);
  });
});

describe('isWebUrl', () => {
  it('accepts http and https, and nothing else', () => {
    expect(isWebUrl('https://example.com/pay')).toBe(true);
    expect(isWebUrl('javascript:alert(1)')).toBe(false);
    expect(isWebUrl('not a url')).toBe(false);
  });
});

describe('formatBillingDate', () => {
  it('leaves a date it cannot read blank, rather than writing "Invalid Date"', () => {
    expect(formatBillingDate('not-a-date')).toBe('');
    expect(formatBillingDate(null)).toBe('');
  });
});
