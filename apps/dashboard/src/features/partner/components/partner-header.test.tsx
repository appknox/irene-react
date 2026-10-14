import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { PartnerEndpoints } from '@irene/api/services/partner';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildPartner, buildSession } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const CLIENTS = '/partner/clients';

/** The header's own tabs, which the side navigation repeats some labels of. */
const partnerTabs = async () =>
  within(await screen.findByRole('navigation', { name: akMT('partnerDashboard') }));

/** Answers the partner record with this access. */
const serverHasPartner = (viewsAnalytics: boolean) => {
  server.use(
    http.get(`*/${PartnerEndpoints.detail('*')}`, () =>
      HttpResponse.json(buildPartner({ access: { view_analytics: viewsAnalytics } }))
    )
  );
};

describe('PartnerHeader', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({ partner_dashboard: true });
    mockOrganizationMe({ can_access_partner_dashboard: true });
    serverHasPartner(false);
  });

  it('names the dashboard and the organization whose it is', async () => {
    renderAtRoute(CLIENTS);

    expect(await screen.findByText(akMT('partnerDashboard'))).toBeInTheDocument();

    expect(
      document.querySelector('[data-test-partner-header-organization]')
    ).not.toBeEmptyDOMElement();
  });

  it('offers the clients tab, which every partner has', async () => {
    renderAtRoute(CLIENTS);

    const header = await partnerTabs();

    expect(header.getByRole('link', { name: akMT('clients') })).toHaveAttribute(
      'data-status',
      'active'
    );
  });

  it('offers analytics to a partner entitled to it', async () => {
    serverHasPartner(true);

    renderAtRoute(CLIENTS);

    const header = await partnerTabs();

    expect(await header.findByRole('link', { name: akMT('analytics') })).toBeInTheDocument();
  });

  it('leaves analytics out for a partner not entitled to it', async () => {
    renderAtRoute(CLIENTS);

    const header = await partnerTabs();

    expect(header.getByRole('link', { name: akMT('clients') })).toBeInTheDocument();
    expect(header.queryByRole('link', { name: akMT('analytics') })).not.toBeInTheDocument();
  });

  it('is not rendered on the dashboard, which is not a partner screen', async () => {
    renderAtRoute('/dashboard/projects');

    await screen.findByText(akMT('startNewScan'));

    expect(document.querySelector('[data-test-partner-header]')).not.toBeInTheDocument();
  });
});
