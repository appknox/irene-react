import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const REPORTS = '/dashboard/reports';

const openReports = () => renderAtRoute(REPORTS);

describe('ReportLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({}, { reporting: true });
  });

  it('opens on the page that generates a report, since reporting has no landing page', async () => {
    await openReports();

    expect(
      await screen.findByRole('heading', { name: akMT('reportModule.generateReport') })
    ).toBeInTheDocument();
  });

  it('leads to the page reporting offers', async () => {
    await openReports();

    const generate = await screen.findByRole('link', { name: akMT('reportModule.generateReport') });

    expect(generate).toHaveAttribute('href', '/dashboard/reports/generate');
  });

  it('leaves the dashboard items out, since they belong to another product', async () => {
    await openReports();

    await screen.findByRole('link', { name: akMT('reportModule.generateReport') });

    expect(screen.queryByRole('link', { name: akMT('allProjects') })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: akMT('organization') })).not.toBeInTheDocument();
  });

  it('offers the switcher, which leads back to the dashboard', async () => {
    await openReports();

    await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

    expect(await screen.findByRole('link', { name: akMT('vapt') })).toBeInTheDocument();
  });

  it('leaves reporting out of its own switcher', async () => {
    await openReports();

    await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

    await screen.findByText(akMT('switchTo'));

    expect(
      screen.queryByRole('link', { name: akMT('reportModule.title') })
    ).not.toBeInTheDocument();
  });

  it('names the product in the bar', async () => {
    await openReports();

    expect(await screen.findByText(akMT('reportModule.reportingEngine'))).toBeInTheDocument();
  });

  it('marks the bar as AI powered, and explains what that means', async () => {
    await openReports();

    await userEvent.click(await screen.findByRole('button', { name: akMT('aiPoweredFeatures') }));

    const drawer = await screen.findByRole('dialog', { name: akMT('aiPoweredFeatures') });

    expect(within(drawer).getByText(akMT('reportModule.aiDataAccess'))).toBeInTheDocument();
    expect(within(drawer).getByText(akMT('reportModule.aiDataUsage'))).toBeInTheDocument();
    expect(within(drawer).getByText(akMT('reportModule.aiDataProtection'))).toBeInTheDocument();

    expect(within(drawer).getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders no notification bell on a reporting page', async () => {
    await openReports();

    await screen.findByRole('link', { name: akMT('reportModule.generateReport') });

    expect(document.querySelector('[data-test-notifications-bell]')).not.toBeInTheDocument();
  });

  it('opens at the width the navigation was left at in another product', async () => {
    window.localStorage.setItem('irene:sidebar-state', 'expanded');

    await openReports();

    expect(await screen.findByRole('button', { name: akMT('collapse') })).toBeInTheDocument();
  });

  it('stores the width it is toggled to for every product to read', async () => {
    await openReports();

    await userEvent.click(await screen.findByRole('button', { name: akMT('expand') }));

    expect(window.localStorage.getItem('irene:sidebar-state')).toBe('expanded');
  });
});
