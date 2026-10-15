import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BillingEndpoints, type ApiSubscriptionInfo } from '@irene/api/services/billing';
import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT, getIntl } from '@irene/translations/intl';

import { buildServerConfiguration, buildSession, buildSubscriptionInfo } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const SUBSCRIPTION = '/dashboard/subscription';

const SUBSCRIPTION_INFO_URL = `*/${BillingEndpoints.subscriptionInfo('*')}`;

const mockSubscriptionInfo = (info: ApiSubscriptionInfo) =>
  server.use(http.get(SUBSCRIPTION_INFO_URL, () => HttpResponse.json(info)));

/** An owner of an organization that shows its subscription: the one account the page is for. */
const asSubscriptionOwner = () => {
  mockOrganizationFeatures({}, {}, { show_subscription: true });
  mockOrganizationMe({ is_owner: true });
};

const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const mediumDate = (iso: string) => getIntl().formatDate(new Date(iso), { format: 'mediumDate' });

const figure = (id: string) => document.querySelector(`[data-test-subscription-figure="${id}"]`);

describe('SubscriptionPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('who may open it', () => {
    it('sends a member to the projects, even where the organization shows its subscription', async () => {
      mockOrganizationFeatures({}, {}, { show_subscription: true });
      mockOrganizationMe({ is_owner: false });

      const { router } = await renderAtRoute(SUBSCRIPTION);

      expect(router.state.location.pathname).toBe('/dashboard/projects');
    });

    it('sends an owner to the projects where the organization does not show its subscription', async () => {
      mockOrganizationFeatures({}, {}, { show_subscription: false });
      mockOrganizationMe({ is_owner: true });

      const { router } = await renderAtRoute(SUBSCRIPTION);

      expect(router.state.location.pathname).toBe('/dashboard/projects');
    });
  });

  it('shows the term and the license counts', async () => {
    const info = buildSubscriptionInfo({ original_licenses: 40, licenses_remaining: 10 });

    asSubscriptionOwner();
    mockSubscriptionInfo(info);

    await renderAtRoute(SUBSCRIPTION);

    expect(await screen.findByText(akMT('subscriptionDetails'))).toBeInTheDocument();

    expect(figure('start')).toHaveTextContent(
      getIntl().formatDate(new Date(info.start_date ?? ''), { format: 'mediumDate' })
    );

    expect(figure('end')).toHaveTextContent(
      getIntl().formatDate(new Date(info.expiry_date ?? ''), { format: 'mediumDate' })
    );

    expect(figure('procured')).toHaveTextContent(String(info.original_licenses));
    expect(figure('remaining')).toHaveTextContent(String(info.licenses_remaining));
  });

  it('shows a dash for anything the subscription does not set', async () => {
    asSubscriptionOwner();

    mockSubscriptionInfo(
      buildSubscriptionInfo({
        start_date: null,
        expiry_date: null,
        original_licenses: null,
        licenses_remaining: null,
      })
    );

    await renderAtRoute(SUBSCRIPTION);
    await screen.findByText(akMT('subscriptionDetails'));

    for (const id of ['start', 'end', 'procured', 'remaining']) {
      expect(figure(id)).toHaveTextContent('-');
    }
  });

  describe('warnings', () => {
    it('warns when the term ends within a month', async () => {
      const info = buildSubscriptionInfo({ expiry_date: inDays(15) });

      asSubscriptionOwner();
      mockSubscriptionInfo(info);

      await renderAtRoute(SUBSCRIPTION);

      expect(
        await screen.findByText(
          akMT('subscriptionTermEndingWarning', { date: mediumDate(info.expiry_date ?? '') })
        )
      ).toBeInTheDocument();
    });

    it('says when the term ended once it has', async () => {
      const info = buildSubscriptionInfo({ expiry_date: inDays(-2) });

      asSubscriptionOwner();
      mockSubscriptionInfo(info);

      await renderAtRoute(SUBSCRIPTION);

      expect(
        await screen.findByText(
          akMT('subscriptionTermEndedWarning', { date: mediumDate(info.expiry_date ?? '') })
        )
      ).toBeInTheDocument();
    });

    it('says no licenses are left when none are', async () => {
      asSubscriptionOwner();
      mockSubscriptionInfo(buildSubscriptionInfo({ licenses_remaining: 0 }));

      await renderAtRoute(SUBSCRIPTION);

      expect(await screen.findByText(akMT('noLicensesLeftWarning'))).toBeInTheDocument();
    });

    it('warns when a tenth or less of the licenses are left', async () => {
      asSubscriptionOwner();
      mockSubscriptionInfo(buildSubscriptionInfo({ original_licenses: 50, licenses_remaining: 4 }));

      await renderAtRoute(SUBSCRIPTION);

      expect(
        await screen.findByText(akMT('fewLicensesLeftWarning', { count: 4, total: 50 }))
      ).toBeInTheDocument();
    });

    it('raises none for a term well ahead with licenses to spare', async () => {
      asSubscriptionOwner();

      mockSubscriptionInfo(
        buildSubscriptionInfo({
          expiry_date: inDays(200),
          original_licenses: 50,
          licenses_remaining: 30,
        })
      );

      await renderAtRoute(SUBSCRIPTION);
      await screen.findByText(akMT('subscriptionDetails'));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('says the subscription is not available when the server has nothing to show', async () => {
    asSubscriptionOwner();

    server.use(
      http.get(SUBSCRIPTION_INFO_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute(SUBSCRIPTION);

    expect(await screen.findByText(akMT('subscriptionNotAvailable'))).toBeInTheDocument();
    expect(screen.queryByText(akMT('subscriptionDetails'))).not.toBeInTheDocument();
  });
});
