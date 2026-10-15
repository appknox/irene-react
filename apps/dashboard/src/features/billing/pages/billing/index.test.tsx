import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BillingEndpoints,
  type ApiInvoice,
  type ApiPlan,
  type ApiSubscription,
} from '@irene/api/services/billing';

import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT, getIntl } from '@irene/translations/intl';

import {
  buildInvoice,
  buildLicense,
  buildPlan,
  buildServerConfiguration,
  buildSession,
  buildSubscription,
} from '@tests/factories';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const BILLING = '/dashboard/billing';

const PLANS_URL = `*/${BillingEndpoints.plans('*')}`;
const SUBSCRIPTIONS_URL = `*/${BillingEndpoints.subscriptions('*')}`;
const SUBSCRIPTION_URL = `*/${BillingEndpoints.subscription('*', '*')}`;
const INVOICES_URL = `*/${BillingEndpoints.invoices('*')}`;
const LICENSE_URL = `*/${BillingEndpoints.license('*')}`;

/** A first page holding these rows, as the server pages a list. */
const page = <T,>(results: T[]) =>
  HttpResponse.json({ count: results.length, next: null, previous: null, results });

const mockSubscriptions = (subscriptions: ApiSubscription[]) =>
  server.use(http.get(SUBSCRIPTIONS_URL, () => page(subscriptions)));

const mockPlans = (plans: ApiPlan[]) => server.use(http.get(PLANS_URL, () => page(plans)));

const mockInvoices = (invoices: ApiInvoice[]) =>
  server.use(http.get(INVOICES_URL, () => page(invoices)));

/**
 * Stands in for the browser's location, so a test can read where the page sent
 * it. It keeps the page's own address until then: axios resolves every request
 * against it.
 */
const stubLocation = () => {
  const location = { ...window.location };

  vi.spyOn(window, 'location', 'get').mockReturnValue(location);

  return location;
};

const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const mediumDate = (iso: string) => getIntl().formatDate(new Date(iso), { format: 'mediumDate' });

const usd = (amount: number) => getIntl().formatNumber(amount, { format: 'USD' });

const planCard = async (plan: ApiPlan) => {
  const card = (await screen.findByText(plan.name)).closest('article');

  if (!card) {
    throw new Error(`No card for ${plan.name}`);
  }

  return card;
};

describe('BillingPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockSubscriptions([]);
    mockPlans([]);
    mockInvoices([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('without a subscription', () => {
    it('offers the plans in the order the server numbers them', async () => {
      const second = buildPlan({ id: '2' });
      const first = buildPlan({ id: '1' });

      mockPlans([second, first]);

      await renderAtRoute(BILLING);
      await planCard(first);

      const names = [...document.querySelectorAll('[data-test-plan] h3')].map(
        (name) => name.textContent
      );

      expect(names).toEqual([first.name, second.name]);
    });

    it('lists what each plan includes', async () => {
      const plan = buildPlan({ description: 'Static scans, Dynamic scans' });

      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);

      expect(within(card).getByText('Static scans')).toBeInTheDocument();
      expect(within(card).getByText('Dynamic scans')).toBeInTheDocument();
    });

    it('prices a plan for the billing period chosen', async () => {
      const plan = buildPlan();

      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);

      expect(
        within(card).getByRole('button', {
          name: akMT('payAmount', { amount: plan.monthly_price }),
        })
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: akMT('yearly') }));

      expect(
        within(card).getByRole('button', { name: akMT('payAmount', { amount: plan.yearly_price }) })
      ).toBeInTheDocument();

      expect(screen.getByRole('button', { name: akMT('yearly') })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('multiplies the price by the quantity, which never drops below one', async () => {
      const plan = buildPlan();

      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);
      const decrease = within(card).getByRole('button', { name: akMT('decreaseQuantity') });

      expect(decrease).toBeDisabled();

      await userEvent.click(within(card).getByRole('button', { name: akMT('increaseQuantity') }));
      await userEvent.click(within(card).getByRole('button', { name: akMT('increaseQuantity') }));
      await userEvent.click(decrease);

      expect(
        within(card).getByRole('button', {
          name: akMT('payAmount', { amount: plan.monthly_price * 2 }),
        })
      ).toBeInTheDocument();
    });

    it('counts scans for the per-scan plan and apps for every other', async () => {
      const perScan = buildPlan({ id: '1', plan_id: 'default_per_scan' });
      const perApp = buildPlan({ id: '2' });

      mockPlans([perScan, perApp]);

      await renderAtRoute(BILLING);

      expect(within(await planCard(perScan)).getByText(akMT('scan'))).toBeInTheDocument();
      expect(within(await planCard(perApp)).getByText(akMT('appOrS'))).toBeInTheDocument();
    });

    it('sends a production build to checkout with the quantity on the plan’s link', async () => {
      const plan = buildPlan();
      vi.stubEnv('PROD', true);
      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);
      const location = stubLocation();

      await userEvent.click(within(card).getByRole('button', { name: akMT('increaseQuantity') }));

      await userEvent.click(
        within(card).getByRole('button', {
          name: akMT('payAmount', { amount: plan.monthly_price * 2 }),
        })
      );

      expect(location.href).toBe(`${plan.monthly_url}&subscription[plan_quantity]=2`);
    });

    it('starts no payment from a development build, as irene does', async () => {
      const plan = buildPlan();
      vi.stubEnv('PROD', false);
      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);
      const location = stubLocation();
      const startHref = location.href;

      await userEvent.click(
        within(card).getByRole('button', {
          name: akMT('payAmount', { amount: plan.monthly_price }),
        })
      );

      expect(location.href).toBe(startHref);
    });

    it('refuses a checkout link that is not a web address', async () => {
      const plan = buildPlan({ monthly_url: 'javascript:alert(1)' });
      vi.stubEnv('PROD', true);
      mockPlans([plan]);

      await renderAtRoute(BILLING);

      const card = await planCard(plan);
      const location = stubLocation();
      const startHref = location.href;

      await userEvent.click(
        within(card).getByRole('button', {
          name: akMT('payAmount', { amount: plan.monthly_price }),
        })
      );

      expect(location.href).toBe(startHref);
    });
  });

  describe('with a subscription', () => {
    it('shows the plan, the billing period and the renewal date, and offers no plans', async () => {
      const subscription = buildSubscription({ billing_period: '3', billing_period_unit: 'month' });
      let plansWereAsked = false;

      mockSubscriptions([subscription]);

      server.use(
        http.get(PLANS_URL, () => {
          plansWereAsked = true;

          return page([]);
        })
      );

      await renderAtRoute(BILLING);

      expect(await screen.findByText(subscription.plan_name)).toBeInTheDocument();
      expect(screen.getByText(akMT('monthWithNum', { numMonths: 3 }))).toBeInTheDocument();
      expect(screen.getByText(akMT('youWillBeChargedOn'))).toBeInTheDocument();
      expect(screen.queryByText(akMT('plans'))).not.toBeInTheDocument();
      expect(plansWereAsked).toBe(false);
    });

    it.each([
      [{ is_trial: true, is_cancelled: true }, 'trialWillExpireOn'],
      [{ is_trial: true, is_cancelled: false }, 'trialWillBeConverted'],
      [{ is_trial: false, is_cancelled: true }, 'subscriptionWillExpireOn'],
    ] as const)('words the date for a subscription that is %o', async (state, label) => {
      mockSubscriptions([buildSubscription(state)]);

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT(label))).toBeInTheDocument();
    });

    it('cancels the subscription once confirmed, and then says when it expires', async () => {
      const subscription = buildSubscription();
      let cancelledPath = '';

      mockSubscriptions([subscription]);

      server.use(
        http.delete(SUBSCRIPTION_URL, ({ request }) => {
          cancelledPath = new URL(request.url).pathname;

          return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
        })
      );

      await renderAtRoute(BILLING);
      await userEvent.click(await screen.findByRole('button', { name: akMT('cancelSubsciption') }));

      const dialog = await screen.findByRole('dialog');

      expect(dialog).toHaveTextContent(akMT('confirmBox.cancelSubsciption'));

      await userEvent.click(
        within(dialog).getByRole('button', { name: akMT('cancelSubsciption') })
      );

      expect(await screen.findByText(akMT('subscriptionCancelled'))).toBeInTheDocument();

      expect(cancelledPath).toMatch(
        new RegExp(`/organizations/[^/]+/subscriptions/${subscription.id}$`)
      );

      expect(await screen.findByText(akMT('subscriptionWillExpireOn'))).toBeInTheDocument();

      expect(
        screen.queryByRole('button', { name: akMT('cancelSubsciption') })
      ).not.toBeInTheDocument();
    });

    it('keeps the subscription when the owner backs out', async () => {
      mockSubscriptions([buildSubscription()]);

      await renderAtRoute(BILLING);
      await userEvent.click(await screen.findByRole('button', { name: akMT('cancelSubsciption') }));

      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: akMT('keepSubscription'),
        })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText(akMT('youWillBeChargedOn'))).toBeInTheDocument();
    });

    it('closes the confirmation from its header', async () => {
      mockSubscriptions([buildSubscription()]);

      await renderAtRoute(BILLING);
      await userEvent.click(await screen.findByRole('button', { name: akMT('cancelSubsciption') }));

      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', { name: akMT('close') })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('shows the server’s reason when the cancellation is refused', async () => {
      const message = faker.lorem.sentence();

      mockSubscriptions([buildSubscription()]);

      server.use(
        http.delete(SUBSCRIPTION_URL, () =>
          HttpResponse.json({ message }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
        )
      );

      await renderAtRoute(BILLING);
      await userEvent.click(await screen.findByRole('button', { name: akMT('cancelSubsciption') }));

      await userEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: akMT('cancelSubsciption'),
        })
      );

      expect(await screen.findByText(message)).toBeInTheDocument();
    });

    it('shows how many apps the subscription covers, and that it is active', async () => {
      const subscription = buildSubscription();

      mockSubscriptions([subscription]);

      await renderAtRoute(BILLING);

      expect(await screen.findByText(subscription.plan_quantity)).toBeInTheDocument();
      expect(screen.getByText(akMT('subscriptionStatusActive'))).toBeInTheDocument();
    });

    it.each([
      [{ is_trial: true }, 'subscriptionStatusTrial'],
      [{ is_cancelled: true }, 'cancelled'],
    ] as const)('marks a subscription that is %o', async (state, label) => {
      mockSubscriptions([buildSubscription(state)]);

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT(label))).toBeInTheDocument();
    });

    it('warns that a cancelled subscription ending soon stops paid features', async () => {
      const subscription = buildSubscription({ is_cancelled: true, expiry_date: inDays(12) });

      mockSubscriptions([subscription]);

      await renderAtRoute(BILLING);

      expect(
        await screen.findByText(
          akMT('subscriptionEndingWarning', { date: mediumDate(subscription.expiry_date) })
        )
      ).toBeInTheDocument();
    });

    it('warns that a cancelled trial ending soon stops paid features', async () => {
      const subscription = buildSubscription({
        is_trial: true,
        is_cancelled: true,
        expiry_date: inDays(5),
      });

      mockSubscriptions([subscription]);

      await renderAtRoute(BILLING);

      expect(
        await screen.findByText(
          akMT('trialEndingWarning', { date: mediumDate(subscription.expiry_date) })
        )
      ).toBeInTheDocument();
    });

    it('raises no warning for a subscription that renews, however soon', async () => {
      mockSubscriptions([buildSubscription({ expiry_date: inDays(3) })]);

      await renderAtRoute(BILLING);
      await screen.findByText(akMT('youWillBeChargedOn'));

      expect(document.querySelector('[data-test-subscription-ending]')).not.toBeInTheDocument();
    });

    it('shows a per-scan subscription by its heading alone, as irene does', async () => {
      const subscription = buildSubscription({ is_per_scan: true });

      mockSubscriptions([subscription]);

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT('activeSubscription'))).toBeInTheDocument();
      expect(screen.queryByText(subscription.plan_name)).not.toBeInTheDocument();
    });
  });

  describe('invoices', () => {
    it('says there are no invoices yet, rather than leaving the block out', async () => {
      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT('noInvoicesYet'))).toBeInTheDocument();
    });

    it('lists each invoice with its amount and when it was paid', async () => {
      const paid = buildInvoice();

      mockInvoices([paid]);

      await renderAtRoute(BILLING);

      const row = (await screen.findByText(paid.invoice_id)).closest('tr');

      expect(row).toHaveTextContent(usd(Number(paid.amount)));
      expect(row).toHaveTextContent(mediumDate(paid.paid_on ?? ''));
      expect(row).toHaveTextContent(akMT('paid'));
    });

    it('shows when an unpaid invoice falls due', async () => {
      const unpaid = buildInvoice({ is_paid: false, paid_on: null, due_date: inDays(10) });

      mockInvoices([unpaid]);

      await renderAtRoute(BILLING);

      const row = (await screen.findByText(unpaid.invoice_id)).closest('tr');

      expect(row).toHaveTextContent(
        akMT('invoiceDueOn', { date: mediumDate(unpaid.due_date ?? '') })
      );

      expect(row).toHaveTextContent(akMT('unpaid'));
    });

    it('marks an unpaid invoice past its due date as overdue', async () => {
      const overdue = buildInvoice({ is_paid: false, paid_on: null, due_date: inDays(-3) });

      mockInvoices([overdue]);

      await renderAtRoute(BILLING);

      const row = (await screen.findByText(overdue.invoice_id)).closest('tr');

      expect(row).toHaveTextContent(akMT('invoiceOverdue'));
    });

    it('says pending for an unpaid invoice with no due date, as irene does', async () => {
      const unpaid = buildInvoice({ is_paid: false, paid_on: null, due_date: null });

      mockInvoices([unpaid]);

      await renderAtRoute(BILLING);

      expect((await screen.findByText(unpaid.invoice_id)).closest('tr')).toHaveTextContent(
        akMT('pending')
      );
    });

    it('sends the browser to the PDF link the invoice answers with', async () => {
      const invoice = buildInvoice();
      const pdf = faker.internet.url();
      mockInvoices([invoice]);
      server.use(http.get(`*${invoice.download_url}`, () => HttpResponse.json({ url: pdf })));

      await renderAtRoute(BILLING);

      const download = await screen.findByRole('button', { name: akMT('download') });
      const location = stubLocation();

      await userEvent.click(download);

      await waitFor(() => expect(location.href).toBe(pdf));
    });

    it('says so when the link cannot be had, or is not a web address', async () => {
      const invoice = buildInvoice();

      mockInvoices([invoice]);

      server.use(
        http.get(`*${invoice.download_url}`, () =>
          HttpResponse.json({ url: 'javascript:alert(1)' })
        )
      );

      await renderAtRoute(BILLING);

      const download = await screen.findByRole('button', { name: akMT('download') });

      stubLocation();
      await userEvent.click(download);

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });

    it('says so when the server refuses the download', async () => {
      const invoice = buildInvoice();

      mockInvoices([invoice]);

      server.use(
        http.get(`*${invoice.download_url}`, () =>
          HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        )
      );

      await renderAtRoute(BILLING);
      await userEvent.click(await screen.findByRole('button', { name: akMT('download') }));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });
  });

  describe('on a deployment that shows its license', () => {
    beforeEach(() => {
      vi.stubGlobal('runtimeGlobalConfig', { IRENE_SHOW_LICENSE: 'true' });
    });

    it('shows the license in place of billing', async () => {
      const license = buildLicense();

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));

      await renderAtRoute(BILLING);

      expect(await screen.findByText(license.per_app_name)).toBeInTheDocument();
      expect(screen.getByText(String(license.per_app_quantity))).toBeInTheDocument();
      expect(screen.getByText(license.key)).toBeInTheDocument();
      expect(screen.getByText(`${license.name} <${license.email}>`)).toBeInTheDocument();
      expect(screen.queryByText(akMT('plans'))).not.toBeInTheDocument();
    });

    it('marks a license that is no longer active', async () => {
      const license = buildLicense({ status: 'Expired' });

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));

      await renderAtRoute(BILLING);

      expect(await screen.findByText(license.status)).toBeInTheDocument();
      expect(document.querySelector('[data-test-license-status]')).toHaveClass('text-danger');
    });

    it('copies the license key', async () => {
      const user = userEvent.setup();
      const license = buildLicense();

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));

      await renderAtRoute(BILLING);
      await screen.findByText(license.key);
      await user.click(screen.getByRole('button', { name: akMT('copy') }));

      expect(await screen.findByText(akMT('copiedToClipboard'))).toBeInTheDocument();
      await expect(navigator.clipboard.readText()).resolves.toBe(license.key);
    });

    it('says so when the browser refuses the clipboard', async () => {
      const user = userEvent.setup();
      const license = buildLicense();

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

      await renderAtRoute(BILLING);
      await screen.findByText(license.key);
      await user.click(screen.getByRole('button', { name: akMT('copy') }));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });

    it('warns when the license expires within a month', async () => {
      const license = buildLicense({ expiry_date: inDays(20) });

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));

      await renderAtRoute(BILLING);

      expect(
        await screen.findByText(
          akMT('licenseExpiringWarning', { date: mediumDate(license.expiry_date) })
        )
      ).toBeInTheDocument();
    });

    it('says the license has expired once its date has passed, whatever its status reads', async () => {
      server.use(
        http.get(LICENSE_URL, () => HttpResponse.json(buildLicense({ expiry_date: inDays(-1) })))
      );

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT('licenseExpiredWarning'))).toBeInTheDocument();
      expect(document.querySelector('[data-test-license-expiring]')).not.toBeInTheDocument();
    });

    it('shows the scan half of a per-scan license', async () => {
      const license = buildLicense({
        is_limited_scans: true,
        per_scan_quantity: 40,
        per_app_quantity: 0,
      });

      server.use(http.get(LICENSE_URL, () => HttpResponse.json(license)));

      await renderAtRoute(BILLING);

      expect(await screen.findByText(license.per_scan_name)).toBeInTheDocument();
      expect(screen.getByText(akMT('noOfScans'))).toBeInTheDocument();
      expect(screen.getByText(license.per_scan_description)).toBeInTheDocument();
    });

    it('falls back to billing when the server has no license to show', async () => {
      server.use(
        http.get(LICENSE_URL, () => HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND }))
      );

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT('plans'))).toBeInTheDocument();
    });

    it('falls back to billing when the organization hides it', async () => {
      server.use(http.get(LICENSE_URL, () => HttpResponse.json(buildLicense())));
      mockOrganizationFeatures({}, {}, { billing_hidden: true });

      await renderAtRoute(BILLING);

      expect(await screen.findByText(akMT('plans'))).toBeInTheDocument();
      expect(screen.queryByText(akMT('license'))).not.toBeInTheDocument();
    });
  });

  it('asks for no license on a deployment that does not show one', async () => {
    let licenseWasAsked = false;

    server.use(
      http.get(LICENSE_URL, () => {
        licenseWasAsked = true;

        return HttpResponse.json(buildLicense());
      })
    );

    await renderAtRoute(BILLING);
    await screen.findByText(akMT('plans'));

    expect(licenseWasAsked).toBe(false);
  });
});
