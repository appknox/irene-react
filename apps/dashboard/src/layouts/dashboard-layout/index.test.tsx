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

  it.each([
    ['store monitoring', '/dashboard/storeknox/inventory/app-list'],
    ['the partner screens', '/partner/clients'],
  ])('offers no upload in %s, which is another product', async (_label, route) => {
    renderAtRoute(route);

    await waitFor(() => expect(document.querySelector('[data-test-top-nav]')).toBeInTheDocument());

    expect(uploadSection()).not.toBeInTheDocument();
  });
});
