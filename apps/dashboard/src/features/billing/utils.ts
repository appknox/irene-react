import { ENUMS } from '@irene/enums';
import { akMT, getIntl } from '@irene/translations/intl';
import type { ApiPlan, ApiSubscription } from '@irene/api/services/billing';

/** The billing periods a plan is offered for, in the order irene lists them. */
export const PAYMENT_DURATIONS = [
  ENUMS.PAYMENT_DURATION.MONTHLY,
  ENUMS.PAYMENT_DURATION.QUARTERLY,
  ENUMS.PAYMENT_DURATION.HALFYEARLY,
  ENUMS.PAYMENT_DURATION.YEARLY,
] as const;

export type PaymentDuration = (typeof PAYMENT_DURATIONS)[number];

/**
 * What a billing period is called.
 *
 * @param duration - The period.
 * @returns Its name, in the active locale.
 */
export function getDurationLabel(duration: PaymentDuration) {
  switch (duration) {
    case ENUMS.PAYMENT_DURATION.MONTHLY:
      return akMT('monthly');
    case ENUMS.PAYMENT_DURATION.QUARTERLY:
      return akMT('quarterly');
    case ENUMS.PAYMENT_DURATION.HALFYEARLY:
      return akMT('halfYearly');
    default:
      return akMT('yearly');
  }
}

/**
 * A plan's price and checkout link for one billing period.
 *
 * @param plan - The plan.
 * @param duration - The period.
 * @returns The price of one unit, and where to pay for it.
 */
export function getPlanPricing(plan: ApiPlan, duration: PaymentDuration) {
  switch (duration) {
    case ENUMS.PAYMENT_DURATION.MONTHLY:
      return { price: plan.monthly_price, url: plan.monthly_url };
    case ENUMS.PAYMENT_DURATION.QUARTERLY:
      return { price: plan.quarterly_price, url: plan.quarterly_url };
    case ENUMS.PAYMENT_DURATION.HALFYEARLY:
      return { price: plan.half_yearly_price, url: plan.half_yearly_url };
    default:
      return { price: plan.yearly_price, url: plan.yearly_url };
  }
}

/**
 * The checkout link for a quantity of a plan. The link already carries a query
 * string, so the quantity is appended to it as irene appends it.
 *
 * @param url - The plan's checkout link for the chosen period.
 * @param quantity - How many apps or scans.
 * @returns The link to send the owner to.
 */
export const getCheckoutUrl = (url: string, quantity: number) =>
  [url, `subscription[plan_quantity]=${quantity}`].join('&');

/**
 * Whether a link the server handed back is a web address, and so safe to send
 * the browser to. A `javascript:` or `data:` link never is.
 *
 * @param url - The link.
 * @returns Whether it is http or https.
 */
export function isWebUrl(url: string) {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * The sentence before a subscription's end date: when a trial ends or turns
 * paid, or when a subscription renews or lapses.
 *
 * @param subscription - The subscription.
 * @returns The sentence, which the date follows.
 */
export function getSubscriptionDateLabel(subscription: ApiSubscription) {
  if (subscription.is_trial) {
    return subscription.is_cancelled ? akMT('trialWillExpireOn') : akMT('trialWillBeConverted');
  }

  return subscription.is_cancelled ? akMT('subscriptionWillExpireOn') : akMT('youWillBeChargedOn');
}

/**
 * A subscription's billing period in words: "3 Months", "1 Year". A unit the
 * server reports that is neither is shown as it came.
 *
 * @param subscription - The subscription.
 * @returns The period.
 */
export function getBillingPeriodLabel(subscription: ApiSubscription) {
  const count = Number(subscription.billing_period);

  switch (subscription.billing_period_unit.toLowerCase()) {
    case 'year':
      return akMT('yearWithNum', { numYears: count });
    case 'month':
      return akMT('monthWithNum', { numMonths: count });
    default:
      return subscription.billing_period_unit;
  }
}

/**
 * A date the server sent, in the active locale, or nothing when it cannot be
 * read, rather than "Invalid Date".
 *
 * @param value - The ISO 8601 timestamp.
 * @returns The date, or an empty string.
 */
export function formatBillingDate(value: string | null) {
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime())
    ? getIntl().formatDate(date, { format: 'mediumDate' })
    : '';
}

/** How far ahead an ending subscription, term or license is called out. */
export const EXPIRY_WARNING_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a date the server sent has passed.
 *
 * @param value - The ISO 8601 timestamp.
 * @returns Whether it is in the past; false when it is missing or unreadable.
 */
export function hasPassed(value: string | null) {
  const time = value ? new Date(value).getTime() : Number.NaN;

  return !Number.isNaN(time) && time < Date.now();
}

/**
 * Whether a date the server sent falls within the warning window from now.
 *
 * @param value - The ISO 8601 timestamp.
 * @returns Whether it is still ahead, but no more than `EXPIRY_WARNING_DAYS` away.
 */
export function isEndingSoon(value: string | null) {
  const time = value ? new Date(value).getTime() : Number.NaN;
  const remaining = time - Date.now();

  return !Number.isNaN(time) && remaining >= 0 && remaining <= EXPIRY_WARNING_DAYS * DAY_MS;
}
