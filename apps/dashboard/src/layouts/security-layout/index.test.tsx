import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const SECURITY_PROJECTS = '/security/projects';

const openSecurity = () => renderAtRoute(SECURITY_PROJECTS);

describe('SecurityLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({});
    mockOrganizationMe({ has_security_permission: true });
  });

  it('renders its own navigation items rather than the dashboard items', async () => {
    openSecurity();

    expect(await screen.findByRole('link', { name: akMT('allProjects') })).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: akMT('securityModule.downloadApp') })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: akMT('securityModule.purgeApiAnalyses') })
    ).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: akMT('organization') })).not.toBeInTheDocument();
  });

  it('marks the item of the page being shown', async () => {
    openSecurity();

    const projects = await screen.findByRole('link', { name: akMT('allProjects') });
    const downloadApp = screen.getByRole('link', { name: akMT('securityModule.downloadApp') });

    expect(projects).toHaveAttribute('data-status', 'active');
    expect(downloadApp).not.toHaveAttribute('data-status', 'active');
  });

  it('opens the page the account chooses', async () => {
    openSecurity();

    await userEvent.click(
      await screen.findByRole('link', { name: akMT('securityModule.downloadApp') })
    );

    expect(
      await screen.findByRole('link', { name: akMT('securityModule.downloadApp') })
    ).toHaveAttribute('data-status', 'active');
  });

  it('renders no notification bell, the product keeping none', async () => {
    openSecurity();

    await screen.findByRole('link', { name: akMT('allProjects') });

    expect(document.querySelector('[data-test-notifications-bell]')).not.toBeInTheDocument();
  });

  it('offers the switcher, which leads back to the dashboard', async () => {
    openSecurity();

    await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

    expect(await screen.findByRole('link', { name: akMT('vapt') })).toBeInTheDocument();
  });

  it('leaves itself out of its own switcher', async () => {
    openSecurity();

    await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

    await screen.findByText(akMT('switchTo'));

    expect(screen.queryByRole('link', { name: akMT('securityDashboard') })).not.toBeInTheDocument();
  });

  it('opens at the width the navigation was left at in another product', async () => {
    window.localStorage.setItem('irene:sidebar-state', 'expanded');

    openSecurity();

    expect(await screen.findByRole('button', { name: akMT('collapse') })).toBeInTheDocument();
  });

  it('opens on the projects, the security dashboard having no landing page', async () => {
    const { router } = await renderAtRoute('/security');

    await screen.findByRole('link', { name: akMT('allProjects') });

    expect(router.state.location.pathname).toBe('/security/projects');
  });
});
