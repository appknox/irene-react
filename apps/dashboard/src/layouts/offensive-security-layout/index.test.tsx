import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const OFFENSIVE_SECURITY = '/dashboard/offensive-security';

const openOffensiveSecurity = () => renderAtRoute(OFFENSIVE_SECURITY);

describe('OffensiveSecurityLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({ offensive_security: true });
  });

  it('renders its own navigation item rather than the dashboard items', async () => {
    openOffensiveSecurity();

    expect(
      await screen.findByRole('link', { name: akMT('offensiveSecurity.attackRuns') })
    ).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: akMT('allProjects') })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: akMT('inventory') })).not.toBeInTheDocument();
  });

  it('renders the upload section, the product taking its own uploads', async () => {
    openOffensiveSecurity();

    expect(await screen.findByText(akMT('startNewScan'))).toBeInTheDocument();
  });

  it('renders no onboarding guides, none being recorded for the product', async () => {
    openOffensiveSecurity();

    await screen.findByText(akMT('startNewScan'));

    expect(
      screen.queryByRole('button', { name: akMT('onboardingGuides') })
    ).not.toBeInTheDocument();
  });

  it('renders the notification bell, which the product keeps', async () => {
    openOffensiveSecurity();

    await screen.findByText(akMT('startNewScan'));

    expect(document.querySelector('[data-test-notifications-bell]')).toBeInTheDocument();
  });

  it('leaves itself out of the switcher, and leads back to the dashboard', async () => {
    openOffensiveSecurity();

    await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

    await screen.findByText(akMT('switchTo'));

    expect(await screen.findByRole('link', { name: akMT('vapt') })).toBeInTheDocument();

    expect(
      screen.queryByRole('link', { name: akMT('offensiveSecurity.title') })
    ).not.toBeInTheDocument();
  });

  it('opens at the width the navigation was left at in another product', async () => {
    window.localStorage.setItem('irene:sidebar-state', 'expanded');

    openOffensiveSecurity();

    expect(await screen.findByRole('button', { name: akMT('collapse') })).toBeInTheDocument();
  });
});
