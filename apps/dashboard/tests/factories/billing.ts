import { faker } from '@faker-js/faker';
import type { ApiInvoice, ApiLicense, ApiPlan, ApiSubscription } from '@irene/api/services/billing';

/** A plan, with a price and a checkout link for each billing period. */
export const buildPlan = (overrides: Partial<ApiPlan> = {}): ApiPlan => {
  const monthly = faker.number.int({ min: 10, max: 200 });

  /* A hosted checkout page, which already carries a query string the quantity is appended to. */
  const checkoutUrl = () =>
    `${faker.internet.url({ appendSlash: true })}hosted_pages/checkout?plan=${faker.string.alphanumeric(8)}`;

  return {
    id: faker.string.alphanumeric(8),
    plan_id: faker.helpers.slugify(faker.word.words(2)),
    name: faker.commerce.productName(),
    description: faker.helpers
      .multiple(() => faker.commerce.productAdjective(), { count: 3 })
      .join(','),
    monthly_url: checkoutUrl(),
    quarterly_url: checkoutUrl(),
    half_yearly_url: checkoutUrl(),
    yearly_url: checkoutUrl(),
    monthly_price: monthly,
    quarterly_price: monthly * 3,
    half_yearly_price: monthly * 6,
    yearly_price: monthly * 10,
    ...overrides,
  };
};

/** An active, paid, per-app subscription unless the test says otherwise. */
export const buildSubscription = (overrides: Partial<ApiSubscription> = {}): ApiSubscription => ({
  id: faker.string.alphanumeric(12),
  plan_name: faker.commerce.productName(),
  billing_period: String(faker.number.int({ min: 1, max: 12 })),
  billing_period_unit: faker.helpers.arrayElement(['month', 'year']),
  plan_quantity: String(faker.number.int({ min: 1, max: 20 })),
  expiry_date: faker.date.future().toISOString(),
  status: 'active',
  is_active: true,
  is_trial: false,
  is_cancelled: false,
  is_per_scan: false,
  ...overrides,
});

/** A paid invoice unless the test says otherwise. */
export const buildInvoice = (overrides: Partial<ApiInvoice> = {}): ApiInvoice => {
  const id = faker.string.alphanumeric(10);

  return {
    id,
    invoice_id: id,
    amount: faker.finance.amount({ min: 10, max: 2000, dec: 2 }),
    paid_on: faker.date.past().toISOString(),
    due_date: faker.date.past().toISOString(),
    is_paid: true,
    plan_name: faker.commerce.productName(),
    download_url: `/api/organizations/1/invoices/${id}/download_url`,
    ...overrides,
  };
};

/** An active per-app enterprise license unless the test says otherwise. */
export const buildLicense = (overrides: Partial<ApiLicense> = {}): ApiLicense => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  key: faker.string.uuid(),
  start_date: faker.date.past().toISOString(),
  expiry_date: faker.date.future().toISOString(),
  status: 'Active',
  name: faker.company.name(),
  email: faker.internet.email(),
  is_limited_scans: false,
  per_app_name: faker.commerce.productName(),
  per_app_description: faker.commerce.productDescription(),
  per_app_quantity: faker.number.int({ min: 1, max: 100 }),
  per_scan_name: faker.commerce.productName(),
  per_scan_description: faker.commerce.productDescription(),
  per_scan_quantity: 0,
  ...overrides,
});
