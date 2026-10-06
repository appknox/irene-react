import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const uploadSection = () => screen.queryByText(akMT('startNewScan'));

describe('DashboardLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({ storeknox: true });
  });

  it('offers an upload on a VAPT page, which is the product that scans apps', async () => {
    renderAtRoute('/dashboard/projects');

    expect(await screen.findByText(akMT('startNewScan'))).toBeInTheDocument();
  });

  it('shows the dashboard items on a VAPT page', async () => {
    renderAtRoute('/dashboard/projects');

    expect(await screen.findByRole('link', { name: akMT('allProjects') })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: akMT('inventory') })).not.toBeInTheDocument();
  });

  it('renders the notification bell on a dashboard page', async () => {
    renderAtRoute('/dashboard/projects');

    await screen.findByText(akMT('startNewScan'));

    expect(document.querySelector('[data-test-notifications-bell]')).toBeInTheDocument();
  });

  it.each([
    ['store monitoring', '/dashboard/storeknox/inventory/app-list'],
    ['the partner screens', '/partner/clients'],
  ])('offers no upload in %s, which is another product', async (_label, route) => {
    renderAtRoute(route);

    await waitFor(() => expect(document.querySelector('[data-test-top-nav]')).toBeInTheDocument());

    expect(uploadSection()).not.toBeInTheDocument();
  });
});
