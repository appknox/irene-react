import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints, type ApiStoreknoxFeatures } from '@irene/api/services/organization';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession, buildStoreknoxOrganization } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const INVENTORY = '/dashboard/storeknox/inventory/app-list';

/** Answers with a store monitoring organization entitled to `skFeatures`. */
const mockStoreknoxFeatures = (skFeatures: Partial<ApiStoreknoxFeatures>) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.storeknoxOrganization()}`, () =>
      HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [
          buildStoreknoxOrganization({
            sk_features: {
              inventory: true,
              drift_detection: false,
              fake_app_detection: false,
              use_ai_validation: false,
              third_party_scanning: false,
              ...skFeatures,
            },
          }),
        ],
      })
    )
  );

describe('StoreknoxLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({ storeknox: true });
  });

  it('renders store monitoring in its own layout', async () => {
    renderAtRoute(INVENTORY);

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(document.querySelector('[data-test-storeknox-layout]')).toBeInTheDocument();
  });

  it('leads to the pages store monitoring offers', async () => {
    renderAtRoute(INVENTORY);

    expect(await screen.findByRole('link', { name: akMT('inventory') })).toHaveAttribute(
      'href',
      INVENTORY
    );
  });

  it('offers the inventory and discovery, which come with the product', async () => {
    renderAtRoute(INVENTORY);

    expect(await screen.findByRole('link', { name: akMT('inventory') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: akMT('discovery') })).toBeInTheDocument();
  });

  it('offers fake app detection to an organization entitled to it', async () => {
    mockStoreknoxFeatures({ fake_app_detection: true });

    renderAtRoute(INVENTORY);

    expect(
      await screen.findByRole('link', { name: akMT('storeknox.fakeAppsTitle') })
    ).toBeInTheDocument();
  });

  it('withholds fake app detection from an organization without it', async () => {
    mockStoreknoxFeatures({ fake_app_detection: false });

    renderAtRoute(INVENTORY);

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.fakeAppsTitle') })
    ).not.toBeInTheDocument();
  });

  it('offers third-party scanning to an organization entitled to it', async () => {
    mockStoreknoxFeatures({ third_party_scanning: true });

    renderAtRoute(INVENTORY);

    expect(
      await screen.findByRole('link', { name: akMT('storeknox.thirdPartyScansTitle') })
    ).toBeInTheDocument();
  });

  it('withholds third-party scanning from an organization without it', async () => {
    mockStoreknoxFeatures({ third_party_scanning: false });

    renderAtRoute(INVENTORY);

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.thirdPartyScansTitle') })
    ).not.toBeInTheDocument();
  });

  it('offers no fake app detection to an account in no StoreKnox organization', async () => {
    server.use(
      http.get(`*/${OrganizationEndpoints.storeknoxOrganization()}`, () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    );

    renderAtRoute(INVENTORY);

    expect(await screen.findByRole('link', { name: akMT('inventory') })).toBeInTheDocument();

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.fakeAppsTitle') })
    ).not.toBeInTheDocument();
  });

  it('leaves the dashboard items out, since they belong to another product', async () => {
    renderAtRoute(INVENTORY);

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(screen.queryByRole('link', { name: akMT('allProjects') })).not.toBeInTheDocument();
  });

  it('offers no upload, which belongs to the product that scans apps', async () => {
    renderAtRoute(INVENTORY);

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(screen.queryByText(akMT('startNewScan'))).not.toBeInTheDocument();
  });

  it('offers its own walkthroughs', async () => {
    renderAtRoute(INVENTORY);

    expect(
      await screen.findByRole('button', { name: akMT('onboardingGuides') })
    ).toBeInTheDocument();
  });

  it('opens on the inventory, store monitoring having no landing page', async () => {
    const { router } = await renderAtRoute('/dashboard/storeknox');

    await screen.findByRole('link', { name: akMT('inventory') });

    expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list');
  });
});
