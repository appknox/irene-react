import { faker } from '@faker-js/faker';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  buildAddedToInventorySkFakeApp,
  buildBrandAbuseSkFakeApp,
  buildIgnoredSkFakeApp,
  buildSkFakeApp,
  buildSkFakeAppStore,
  buildSkInventoryApp,
} from '@tests/factories';

import {
  mockSkAppLists,
  mockSkFakeApp,
  mockSkFakeAppReview,
  mockSkInventoryApp,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { fakeAppConfidence } from '@/features/storeknox/utils/fake-app';
import { renderAtRoute } from '@tests/render';

const detailsOf = (skAppId: number, id: number) =>
  `/dashboard/storeknox/fake-apps/${skAppId}/details/${id}`;

/** Signs in to an organization with fake-app detection and serves the inventory app and the copy. */
function setUp(
  fakeApp = buildSkFakeApp(),
  appOverrides: Parameters<typeof buildSkInventoryApp>[0] = {}
) {
  signInToStoreknox();
  mockStoreknoxOrganization({ sk_features: { fake_app_detection: true } });

  const app = buildSkInventoryApp(appOverrides);

  mockSkInventoryApp(app);
  mockSkFakeApp(app.id, fakeApp);

  return { app, fakeApp, path: detailsOf(app.id, fakeApp.id) };
}

describe('a fake app’s details', () => {
  it('is behind the fake-app detection guard', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { fake_app_detection: false } });
    mockSkAppLists();

    const { router } = await renderAtRoute(detailsOf(faker.number.int({ min: 1, max: 99 }), 1));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });

  it('shows the copy’s title, package, developer, classification, platform and store', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({
        platform: ENUMS.PLATFORM.ANDROID,
        identifier: 'playstore',
        name: 'Google Play Store',
      }),
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const header = await screen.findByRole('region', { name: fakeApp.title });

    expect(within(header).getByRole('link', { name: fakeApp.title })).toHaveAttribute(
      'href',
      fakeApp.app_url
    );

    expect(within(header).getByText(fakeApp.package_name)).toBeVisible();
    expect(within(header).getByText(fakeApp.dev_name)).toBeVisible();
    expect(within(header).getByText(akMT('storeknox.brandAbuse'))).toBeVisible();
    expect(within(header).getByText(akMT('android'))).toBeVisible();
    expect(within(header).getByText(fakeApp.store.name)).toBeVisible();
  });

  it('names an iOS fake app copy by its classification and platform', async () => {
    const fakeApp = buildSkFakeApp({
      ai_classification_label: 'fake_app',
      store: buildSkFakeAppStore({ platform: ENUMS.PLATFORM.IOS }),
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const header = await screen.findByRole('region', { name: fakeApp.title });

    expect(within(header).getByText(akMT('storeknox.fakeApps.fakeApp'))).toBeVisible();
    expect(within(header).getByText(akMT('ios'))).toBeVisible();
  });

  it('shows the AI finding with its justification and confidence', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    expect(await screen.findByText(akMT('storeknox.fakeApps.suspectedBrandAbuse'))).toBeVisible();
    expect(screen.getByText(fakeApp.ai_classification_justification)).toBeVisible();
    expect(screen.getByText(`${fakeAppConfidence(fakeApp)}%`)).toBeVisible();
    expect(screen.getByText(akMT('storeknox.fakeApps.confidence'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.fakeApps.findings'))).toBeVisible();
  });

  it('titles the finding for a fake app by its classification', async () => {
    const fakeApp = buildSkFakeApp({ ai_classification_label: 'fake_app' });
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    expect(await screen.findByText(akMT('storeknox.fakeApps.suspectedFakeApps'))).toBeVisible();
  });

  it('hides the finding when the final score is missing and shows only the signals that have scores', async () => {
    const fakeApp = buildSkFakeApp({
      ai_scores: {
        SemanticSimilarityRule: 91,
        SemanticSimilarityRule_justification: faker.lorem.sentence(),
        PackageSimilarityRule: 40,
      },
      ai_score_levels: { SemanticSimilarityRule: 'HIGH' },
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    expect(
      await screen.findByRole('button', {
        name: new RegExp(akMT('storeknox.fakeApps.brandAnalysis')),
      })
    ).toBeVisible();

    expect(
      screen.queryByText(akMT('storeknox.fakeApps.suspectedFakeApps'))
    ).not.toBeInTheDocument();

    expect(screen.queryByText(fakeApp.ai_classification_justification)).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: new RegExp(akMT('storeknox.fakeApps.packageAnalysis')) })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(akMT('storeknox.fakeApps.binarySimilarityAnalysis'))
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(akMT('storeknox.fakeApps.securityRiskAssessment'))
    ).not.toBeInTheDocument();
  });

  it('shows brand identity with no signals and a group badge for the scores', async () => {
    const fakeApp = buildSkFakeApp({
      ai_scores: { final: 0.5 },
      ai_score_levels: {},
      semantic_analysis_score: 90,
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    expect(await screen.findByText(akMT('storeknox.fakeApps.brandIdentityAnalysis'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.fakeApps.highMatch'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.fakeApps.signal'))).toBeVisible();
  });

  it('opens a signal’s reasoning in a drawer', async () => {
    const justification = faker.lorem.sentence();

    const fakeApp = buildSkFakeApp({
      ai_scores: {
        final: 0.8,
        SigningCertRule: 70,
        SigningCertRule_justification: justification,
      },
      ai_score_levels: { SigningCertRule: 'MEDIUM' },
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    await userEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(akMT('storeknox.fakeApps.signingCertAnalysis')),
      })
    );

    const drawer = await screen.findByRole('dialog');

    expect(
      within(drawer).getByText(akMT('storeknox.fakeApps.binarySimilarityAnalysis'))
    ).toBeVisible();

    expect(within(drawer).getByText(akMT('storeknox.fakeApps.signingCertAnalysis'))).toBeVisible();
    expect(within(drawer).getByText(akMT('storeknox.fakeApps.partialMatch'))).toBeVisible();
    expect(within(drawer).getByText(akMT('storeknox.fakeApps.reasoning'))).toBeVisible();
    expect(within(drawer).getByText(justification)).toBeVisible();

    await userEvent.click(within(drawer).getByRole('button', { name: akMT('close') }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the original app’s details from the inventory app', async () => {
    const { app, path } = setUp();

    await renderAtRoute(path);

    const panel = await screen.findByRole('region', {
      name: akMT('storeknox.fakeApps.originalAppDetails'),
    });

    const metadata = app.app_metadata;

    expect(within(panel).getByRole('link', { name: metadata.title })).toHaveAttribute(
      'href',
      metadata.url
    );

    expect(within(panel).getByText(metadata.package_name)).toBeVisible();
    expect(within(panel).getByText(metadata.dev_name)).toBeVisible();

    expect(
      within(panel).getByText(formatDateTime(app.last_fake_detection_on, 'mediumDate'))
    ).toBeVisible();
  });

  it('disables both actions for a decommissioned app', async () => {
    const { path } = setUp(buildSkFakeApp(), { app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });

    await renderAtRoute(path);

    expect(await screen.findByRole('button', { name: akMT('storeknox.ignoreApp') })).toBeDisabled();

    expect(
      screen.getByRole('button', { name: akMT('storeknox.ignoreAddToInventory') })
    ).toBeDisabled();

    await userEvent.hover(
      screen.getByRole('button', { name: akMT('storeknox.ignoreApp') }).parentElement as HTMLElement
    );

    expect(
      (await screen.findAllByText(akMT('storeknox.decommissionedActionDisabled'))).length
    ).toBeGreaterThan(0);
  });

  it('disables adding an apkmody copy with its own tooltip', async () => {
    const fakeApp = buildSkFakeApp({
      store: buildSkFakeAppStore({ identifier: 'apkmody', name: 'APKMODY store' }),
    });

    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const add = await screen.findByRole('button', {
      name: akMT('storeknox.ignoreAddToInventory'),
    });

    expect(add).toBeDisabled();
    expect(screen.getByRole('button', { name: akMT('storeknox.ignoreApp') })).toBeEnabled();

    await userEvent.hover(add.parentElement as HTMLElement);

    expect(
      (
        await screen.findAllByText(
          akMT('storeknox.fakeApps.cannotIgnoreNonAppStoreAndPlayStoreApps')
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it('marks an ignored copy with the date and swaps the actions for View Details', async () => {
    const fakeApp = buildIgnoredSkFakeApp({ ai_classification_label: 'brand_abuse' });
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const banner = await screen.findByRole('status');

    expect(banner).toHaveTextContent(akMT('storeknox.fakeApps.ignoredBannerIgnored'));
    expect(banner).toHaveTextContent(formatDateTime(fakeApp.reviewed_on, 'mediumDate'));

    expect(
      within(banner).queryByRole('link', { name: akMT('storeknox.viewInInventory') })
    ).not.toBeInTheDocument();

    const header = screen.getByRole('region', { name: fakeApp.title });

    expect(within(header).queryByText(akMT('storeknox.brandAbuse'))).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: akMT('storeknox.ignoreApp') })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('viewDetails') }));

    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(akMT('storeknox.ignoredDetails'))).toBeVisible();
    expect(within(drawer).getByText(fakeApp.ignore_reason ?? '')).toBeVisible();
  });

  it('keeps View Details open for an ignored copy of a decommissioned app', async () => {
    const fakeApp = buildIgnoredSkFakeApp();

    const { path } = setUp(fakeApp, { app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });

    await renderAtRoute(path);

    const viewDetails = await screen.findByRole('button', { name: akMT('viewDetails') });

    expect(viewDetails).toBeEnabled();

    await userEvent.click(viewDetails);

    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(fakeApp.ignore_reason ?? '')).toBeVisible();
  });

  it('keeps the findings after ignoring when the server answers with only the changed fields', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const { app, path } = setUp(fakeApp);
    const reason = faker.lorem.sentence();
    const reviewedBy = faker.person.fullName();
    const reviewedOn = faker.date.recent().toISOString();

    mockSkFakeAppReview(app.id, fakeApp.id, 'ignore', {
      id: fakeApp.id,
      status: ENUMS.SK_FAKE_APP_STATUS.IGNORED,
      status_display: 'Ignored',
      reviewed_by: reviewedBy,
      reviewed_on: reviewedOn,
      ignore_reason: reason,
    });

    await renderAtRoute(path);

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.ignoreApp') }));

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), reason);

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.yesIgnore') }));

    const banner = await screen.findByRole('status');

    expect(banner).toHaveTextContent(formatDateTime(reviewedOn, 'mediumDate'));
    expect(screen.getByText(fakeApp.ai_classification_justification)).toBeVisible();
    expect(screen.getByText(`${fakeAppConfidence(fakeApp)}%`)).toBeVisible();
  });

  it('links an added-to-inventory copy to its inventory app', async () => {
    const fakeApp = buildAddedToInventorySkFakeApp();
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const banner = await screen.findByRole('status');

    expect(banner).toHaveTextContent(
      akMT('storeknox.fakeApps.ignoredBannerIgnoredAndAddedToInventory')
    );

    expect(
      within(banner).getByRole('link', { name: akMT('storeknox.viewInInventory') })
    ).toHaveAttribute(
      'href',
      `/dashboard/storeknox/inventory-details/${fakeApp.added_to_inventory_app}`
    );
  });

  it('words an added-to-inventory copy without an id as added, with no link', async () => {
    const fakeApp = buildAddedToInventorySkFakeApp({ added_to_inventory_app: null });
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const banner = await screen.findByRole('status');

    expect(banner).toHaveTextContent(
      akMT('storeknox.fakeApps.ignoredBannerIgnoredAndAddedToInventory')
    );

    expect(
      within(banner).queryByRole('link', { name: akMT('storeknox.viewInInventory') })
    ).not.toBeInTheDocument();
  });

  it('shows a placeholder when the copy has no icon URL', async () => {
    const fakeApp = buildSkFakeApp({ fake_app_icon_url: '' });
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const header = await screen.findByRole('region', { name: fakeApp.title });

    expect(within(header).queryByRole('img', { name: fakeApp.title })).not.toBeInTheDocument();
    expect(header.querySelector('[data-test-sk-round-app-icon-placeholder]')).toBeInTheDocument();
  });

  it('swaps the copy’s icon for a placeholder when it fails to load', async () => {
    const fakeApp = buildSkFakeApp();
    const { path } = setUp(fakeApp);

    await renderAtRoute(path);

    const header = await screen.findByRole('region', { name: fakeApp.title });

    fireEvent.error(within(header).getByRole('img', { name: fakeApp.title }));

    expect(within(header).queryByRole('img', { name: fakeApp.title })).not.toBeInTheDocument();
    expect(header.querySelector('[data-test-sk-round-app-icon-placeholder]')).toBeInTheDocument();
  });

  it('swaps the original app’s icon for a placeholder when it fails to load', async () => {
    const { app, path } = setUp();

    await renderAtRoute(path);

    const panel = await screen.findByRole('region', {
      name: akMT('storeknox.fakeApps.originalAppDetails'),
    });

    fireEvent.error(within(panel).getByRole('img', { name: app.app_metadata.title }));

    expect(
      within(panel).queryByRole('img', { name: app.app_metadata.title })
    ).not.toBeInTheDocument();

    expect(panel.querySelector('[data-test-sk-round-app-icon-placeholder]')).toBeInTheDocument();
  });

  it('trails back through the app’s list to the listing', async () => {
    const fakeApp = buildSkFakeApp();
    const { app, path } = setUp(fakeApp);

    await renderAtRoute(path);

    const trail = await screen.findByRole('navigation', { name: akMT('storeknox.fakeAppsTitle') });

    expect(
      within(trail).getByRole('link', { name: akMT('storeknox.fakeAppsTitle') })
    ).toHaveAttribute('href', '/dashboard/storeknox/fake-apps');

    expect(
      within(trail).getByRole('link', { name: app.app_metadata.package_name })
    ).toHaveAttribute('href', `/dashboard/storeknox/fake-apps/${app.id}`);

    expect(within(trail).getByText(akMT('details'))).toBeVisible();
  });
});
