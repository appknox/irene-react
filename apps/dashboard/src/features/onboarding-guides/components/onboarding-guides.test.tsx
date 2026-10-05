import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigurationEndpoints } from '@irene/api/services/configuration';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildOnboardingGuides } from '@/features/onboarding-guides/guides';
import { buildServerConfiguration, buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const [firstCategory, secondCategory] = buildOnboardingGuides('appknox');
const [storeknoxCategory] = buildOnboardingGuides('storeknox');
const [firstGuide, secondGuide] = firstCategory.guides;

/** Opens a signed-in page and the guides panel on it. */
const openGuides = async () => {
  renderAtRoute('/dashboard/projects');

  await userEvent.click(await screen.findByRole('button', { name: akMT('onboardingGuides') }));

  return screen.findByRole('dialog', { name: akMT('onboardingGuides') });
};

/** The frame currently showing a guide. */
const guideFrame = () => document.querySelector('[data-test-onboarding-guides-frame]');

describe('OnboardingGuides', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({});
  });

  it('lists every guide, under the heading it belongs to', async () => {
    await openGuides();

    expect(screen.getByText(firstCategory.category)).toBeInTheDocument();
    expect(screen.getByText(secondCategory.category)).toBeInTheDocument();

    expect(document.querySelectorAll('[data-test-onboarding-guides-item]')).toHaveLength(
      firstCategory.guides.length + secondCategory.guides.length
    );
  });

  it('shows the first guide before one is chosen', async () => {
    await openGuides();

    expect(guideFrame()).toHaveAttribute('src', firstGuide.url);
    expect(guideFrame()).toHaveAttribute('title', firstGuide.title);
  });

  it('marks the first guide as the one playing, before anything is chosen', async () => {
    await openGuides();

    const first = document.querySelector(`[data-test-onboarding-guides-item="${firstGuide.id}"]`);
    const second = document.querySelector(`[data-test-onboarding-guides-item="${secondGuide.id}"]`);

    expect(first).toHaveClass('bg-primary/20');
    expect(second).not.toHaveClass('bg-primary/20');

    /* The one playing takes no hover, which would otherwise paint over it. */
    expect(first).not.toHaveClass('hover:bg-black/4');
    expect(second).toHaveClass('hover:bg-black/4');
  });

  it('shows the guide the account chooses', async () => {
    await openGuides();

    await userEvent.click(screen.getByText(secondGuide.title));

    expect(guideFrame()).toHaveAttribute('src', secondGuide.url);
  });

  it('builds a new frame for each guide, so the last one stops playing', async () => {
    await openGuides();

    const first = guideFrame();

    await userEvent.click(screen.getByText(secondGuide.title));

    expect(guideFrame()).not.toBe(first);
  });

  it('lists store monitoring walkthroughs on its own pages', async () => {
    mockOrganizationFeatures({ storeknox: true });

    renderAtRoute('/dashboard/storeknox/inventory/app-list');

    await userEvent.click(await screen.findByRole('button', { name: akMT('onboardingGuides') }));

    /* Scoped to the panel: the product names itself in the page heading too. */
    const panel = within(await screen.findByRole('dialog', { name: akMT('onboardingGuides') }));

    expect(panel.getByText(storeknoxCategory.category)).toBeInTheDocument();
    expect(panel.getByText(storeknoxCategory.guides[0].title)).toBeInTheDocument();

    /* The VAPT walkthroughs belong to the other product. */
    expect(panel.queryByText(firstGuide.title)).not.toBeInTheDocument();
  });

  it('falls to the first guide of the product when the account switches product', async () => {
    mockOrganizationFeatures({ storeknox: true });

    const { router } = await renderAtRoute('/dashboard/projects');

    await userEvent.click(await screen.findByRole('button', { name: akMT('onboardingGuides') }));
    await userEvent.click(await screen.findByText(secondGuide.title));

    expect(guideFrame()).toHaveAttribute('src', secondGuide.url);

    await userEvent.keyboard('{Escape}');
    await act(() => router.navigate({ to: '/dashboard/storeknox/inventory/app-list' }));

    await userEvent.click(await screen.findByRole('button', { name: akMT('onboardingGuides') }));

    /* The id it was watching belongs to the other product, so the new list leads. */
    expect(guideFrame()).toHaveAttribute('src', storeknoxCategory.guides[0].url);
  });

  it('is not offered on a self-hosted install, which these are not recorded against', async () => {
    server.use(
      http.get(`*/${ConfigurationEndpoints.server()}`, () =>
        HttpResponse.json(buildServerConfiguration({ enterprise: true }))
      )
    );

    renderAtRoute('/dashboard/projects');

    await screen.findByText(akMT('startNewScan'));

    expect(
      screen.queryByRole('button', { name: akMT('onboardingGuides') })
    ).not.toBeInTheDocument();
  });
});
