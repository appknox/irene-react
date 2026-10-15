import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { BillingEndpoints, BillingService } from '@irene/api/services/billing';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildInvoice, buildLicense, buildPlan, buildSubscription } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const ORGANIZATION_ID = 42;

/** A first page holding these rows, as the server pages a list. */
const page = <T>(results: T[]) =>
  HttpResponse.json({ count: results.length, next: null, previous: null, results });

describe('BillingService lists', () => {
  it('returns the plans out of their page', async () => {
    const plans = [buildPlan(), buildPlan()];

    server.use(
      http.get(buildAPITestURL(BillingEndpoints.plans(ORGANIZATION_ID)), () => page(plans))
    );

    await expect(BillingService.getPlans(ORGANIZATION_ID)).resolves.toEqual(plans);
  });

  it('returns the subscriptions out of their page', async () => {
    const subscriptions = [buildSubscription()];

    server.use(
      http.get(buildAPITestURL(BillingEndpoints.subscriptions(ORGANIZATION_ID)), () =>
        page(subscriptions)
      )
    );

    await expect(BillingService.getSubscriptions(ORGANIZATION_ID)).resolves.toEqual(subscriptions);
  });

  it('returns the invoices out of their page', async () => {
    const invoices = [buildInvoice(), buildInvoice({ is_paid: false, paid_on: null })];

    server.use(
      http.get(buildAPITestURL(BillingEndpoints.invoices(ORGANIZATION_ID)), () => page(invoices))
    );

    await expect(BillingService.getInvoices(ORGANIZATION_ID)).resolves.toEqual(invoices);
  });
});

describe('BillingService.cancelSubscription', () => {
  it('deletes the subscription under its organization', async () => {
    const subscription = buildSubscription();
    let wasCancelled = false;

    server.use(
      http.delete(
        buildAPITestURL(BillingEndpoints.subscription(ORGANIZATION_ID, subscription.id)),
        () => {
          wasCancelled = true;

          return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
        }
      )
    );

    await BillingService.cancelSubscription(ORGANIZATION_ID, subscription.id);

    expect(wasCancelled).toBe(true);
  });
});

describe('BillingService.getInvoiceDownload', () => {
  it('asks the invoice’s own path for the link, without doubling the leading slash', async () => {
    const invoice = buildInvoice();
    const url = 'https://invoices.example/pdf';

    server.use(
      http.get(buildAPITestURL(invoice.download_url.slice(1)), () => HttpResponse.json({ url }))
    );

    await expect(BillingService.getInvoiceDownload(invoice.download_url)).resolves.toEqual({ url });
  });
});

describe('BillingService.getLicense', () => {
  it('returns the license', async () => {
    const license = buildLicense();

    server.use(
      http.get(buildAPITestURL(BillingEndpoints.license(ORGANIZATION_ID)), () =>
        HttpResponse.json(license)
      )
    );

    await expect(BillingService.getLicense(ORGANIZATION_ID)).resolves.toEqual(license);
  });

  it('rejects with a 404 where there is no license to show', async () => {
    server.use(
      http.get(buildAPITestURL(BillingEndpoints.license(ORGANIZATION_ID)), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    const error = await BillingService.getLicense(ORGANIZATION_ID).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });
});
