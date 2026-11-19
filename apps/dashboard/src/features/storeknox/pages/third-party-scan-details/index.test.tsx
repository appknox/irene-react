import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints, type ApiSkThirdPartyApp } from '@irene/api/services/storeknox';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  buildSkThirdPartyApp,
  buildSkThirdPartyConfig,
  buildSkThirdPartyFinding,
  buildUnscoredSkThirdPartyApp,
} from '@tests/factories';

import {
  mockSkAppLists,
  mockSkThirdPartyApp,
  mockSkThirdPartyApps,
  mockSkThirdPartyConfig,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const RISK = ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS;

const illustration = () => document.querySelector('[data-test-sk-third-party-risk-illustration]');

/** Waits for the risk score on screen to read `text`. */
const expectScore = (text: string) =>
  waitFor(() =>
    expect(document.querySelector('[data-test-sk-third-party-score]')).toHaveTextContent(text)
  );

const detailsOf = (app: ApiSkThirdPartyApp, search = '') =>
  `/dashboard/storeknox/third-party-scans/${app.package_name}${search}`;

/** Signs in to an organization with third-party scanning, opted into the app's store and region. */
function setUp(app: ApiSkThirdPartyApp) {
  signInToStoreknox();
  mockStoreknoxOrganization({ sk_features: { third_party_scanning: true } });

  mockSkThirdPartyConfig(
    buildSkThirdPartyConfig({
      appstore_regions_opted: app.store === 'appstore' ? [app.region] : [],
      playstore_regions_opted: app.store === 'playstore' ? [app.region] : [],
    })
  );
}

/** Answers each of the app's scanned versions with its own record, and records every request. */
function mockVersions(apps: ApiSkThirdPartyApp[]) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyApps()), ({ request }) => {
      const params = new URL(request.url).searchParams;

      received.push(params);

      const version = params.get('version');

      /* A version the app was not scanned at gets its own, the first. */
      return HttpResponse.json(apps.find((app) => app.version === version) ?? apps[0]);
    })
  );

  return received;
}

describe('a third-party app’s details', () => {
  it('is behind the third-party scanning guard', async () => {
    const app = buildSkThirdPartyApp();

    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { third_party_scanning: false } });
    mockSkAppLists();

    const { router } = await renderAtRoute(detailsOf(app));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });

  it('heads the page with the app’s icon, title, package, developer, platform and store', async () => {
    const app = buildSkThirdPartyApp({ store: 'playstore', platform: ENUMS.PLATFORM.ANDROID });

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    const header = await screen.findByRole('region', { name: app.title });

    expect(within(header).getByRole('img', { name: app.title })).toHaveAttribute(
      'src',
      app.icon_url
    );

    expect(within(header).getByRole('heading', { level: 1, name: app.title })).toBeInTheDocument();

    expect(within(header).getByText(app.package_name)).toBeInTheDocument();
    expect(within(header).getByText(app.dev_name)).toBeInTheDocument();
    expect(within(header).getByText(akMT('android'))).toBeInTheDocument();
    expect(within(header).getByText(akMT('storeknox.playStore'))).toBeInTheDocument();
  });

  it('names the app’s package and the Third-Party App Risk Assessment list in the breadcrumbs', async () => {
    const app = buildSkThirdPartyApp();

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    const trail = await screen.findByRole('navigation', {
      name: akMT('storeknox.thirdPartyScansTitle'),
    });

    expect(
      within(trail).getByRole('link', { name: akMT('storeknox.thirdPartyScansTitle') })
    ).toHaveAttribute('href', expect.stringContaining('/dashboard/storeknox/third-party-scans'));

    expect(within(trail).getByText(app.title)).toBeInTheDocument();
  });

  it('links the breadcrumb back to the list with the app’s store and region when opened by a link', async () => {
    const app = buildSkThirdPartyApp({ store: 'appstore', platform: ENUMS.PLATFORM.IOS });

    setUp(app);
    mockSkThirdPartyApp(app);
    mockSkThirdPartyApps([app]);

    const { router } = await renderAtRoute(detailsOf(app));

    await userEvent.click(
      within(
        await screen.findByRole('navigation', { name: akMT('storeknox.thirdPartyScansTitle') })
      ).getByRole('link', { name: akMT('storeknox.thirdPartyScansTitle') })
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/third-party-scans')
    );

    expect(router.state.location.search).toEqual({ tp_store: app.store, tp_region: app.region });
  });

  it('shows the scanned version when the app’s versions do not list it', async () => {
    const app = buildSkThirdPartyApp({ version: '9.9.9', versions: ['1.0.0', '2.0.0'] });

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    expect(await screen.findByRole('combobox', { name: akMT('version') })).toHaveTextContent(
      'v9.9.9'
    );

    await userEvent.click(screen.getByRole('combobox', { name: akMT('version') }));

    expect(await screen.findByRole('option', { name: 'v9.9.9' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'v1.0.0' })).toBeInTheDocument();
  });

  it('selects the version in the URL when the app has it, else the app’s own', async () => {
    const own = buildSkThirdPartyApp({ version: '2.0.0', versions: ['2.0.0', '1.0.0'] });
    const older = { ...own, version: '1.0.0' };

    setUp(own);
    mockVersions([own, older]);

    const first = await renderAtRoute(detailsOf(own, '?tp_version=1.0.0'));

    expect(await screen.findByRole('combobox', { name: akMT('version') })).toHaveTextContent(
      'v1.0.0'
    );

    first.unmount();

    await renderAtRoute(detailsOf(own, `?tp_version=${faker.string.uuid()}`));

    expect(await screen.findByRole('combobox', { name: akMT('version') })).toHaveTextContent(
      'v2.0.0'
    );
  });

  it('asks for the chosen version and shows its findings', async () => {
    const own = buildSkThirdPartyApp({
      version: '2.0.0',
      versions: ['2.0.0', '1.0.0'],
      score: 80,
    });

    const older = { ...own, version: '1.0.0', score: 35 };

    setUp(own);

    const received = mockVersions([own, older]);

    const { router } = await renderAtRoute(detailsOf(own));

    await expectScore(`${own.score}/100`);

    await userEvent.click(screen.getByRole('combobox', { name: akMT('version') }));
    await userEvent.click(await screen.findByRole('option', { name: 'v1.0.0' }));

    await expectScore('35/100');
    expect(router.state.location.search).toMatchObject({ tp_version: '1.0.0' });
    expect(received[received.length - 1].get('version')).toBe('1.0.0');
  });

  it.each([
    ['high', RISK.HIGH],
    ['medium', RISK.MEDIUM],
    ['minimal', RISK.MINIMAL],
  ])('shows the score, its version and the %s risk illustration', async (name, riskStatus) => {
    const app = buildSkThirdPartyApp({ risk_status: riskStatus });

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    await expectScore(`${app.score}/100`);
    expect(screen.getByText(akMT('riskScore'))).toBeInTheDocument();

    expect(document.querySelector('[data-test-sk-third-party-version-analysis]')).toHaveTextContent(
      `Based on v${app.version} analysis`
    );

    expect(illustration()).toHaveAttribute('data-test-sk-third-party-risk-illustration', name);
  });

  it('shows no illustration for a risk status it does not know', async () => {
    const app = buildSkThirdPartyApp({ risk_status: 7 });

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    await expectScore(`${app.score}/100`);
    expect(illustration()).not.toBeInTheDocument();
  });

  it('shows the assessment error and no details when the app has no score', async () => {
    const app = buildUnscoredSkThirdPartyApp();

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    expect(await screen.findByText(akMT('storeknox.riskScoreUnavailable'))).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.riskAssessmentErrorTitle'))).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.riskAssessmentErrorDescription'))).toBeInTheDocument();
    expect(illustration()).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-sk-third-party-score]')).not.toBeInTheDocument();
  });

  it('resolves the store and region when the link carries none', async () => {
    const app = buildSkThirdPartyApp({ store: 'playstore', platform: ENUMS.PLATFORM.ANDROID });

    setUp(app);

    const received = mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    await expectScore(`${app.score}/100`);

    expect(received[0].get('store')).toBe('playstore');
    expect(received[0].get('region')).toBe(app.region);
    expect(received[0].get('q')).toBe(app.package_name);
    expect(received[0].has('version')).toBe(false);
  });

  it('asks for the store and region in the link when the organization opted into them', async () => {
    const app = buildSkThirdPartyApp({ store: 'appstore', platform: ENUMS.PLATFORM.IOS });

    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { third_party_scanning: true } });

    mockSkThirdPartyConfig(
      buildSkThirdPartyConfig({
        appstore_regions_opted: ['SG', app.region],
        playstore_regions_opted: ['IN'],
      })
    );

    const received = mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app, `?tp_store=appstore&tp_region=${app.region}`));

    await expectScore(`${app.score}/100`);
    expect(received[0].get('region')).toBe(app.region);
  });

  it('shows the route error when the app cannot be loaded', async () => {
    const app = buildSkThirdPartyApp();

    setUp(app);

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyApps()), () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      )
    );

    await renderAtRoute(detailsOf(app));

    expect(await screen.findByRole('button', { name: akMT('retry') })).toBeInTheDocument();
  });

  it('shows the package name for an app with no title and no versions', async () => {
    const app = buildSkThirdPartyApp({ title: '', versions: [] });

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));

    const header = await screen.findByRole('region', { name: app.package_name });

    expect(within(header).queryByRole('combobox')).not.toBeInTheDocument();
  });
});

const findingName = () => faker.string.alphanumeric(14);

/** Renders the details of a scored app with these findings and waits for them. */
async function showFindings(findings: ApiSkThirdPartyApp['findings']) {
  const app = buildSkThirdPartyApp({ findings });

  setUp(app);
  mockSkThirdPartyApp(app);

  await renderAtRoute(detailsOf(app));
  await screen.findByText(akMT('storeknox.technicalDetails'));

  return app;
}

/** The summary button of the group with this label. */
const groupOf = (label: string) =>
  document.querySelector(`[data-test-sk-third-party-category="${label}"]`)?.closest('button') ??
  null;

describe('a third-party app’s risk assessment details', () => {
  it('counts potential risks and clean checks in the heading chips', async () => {
    const findings = [
      buildSkThirdPartyFinding({ is_potential_risk: true }),
      buildSkThirdPartyFinding({ is_potential_risk: true }),
      buildSkThirdPartyFinding({ is_potential_risk: false }),
    ];

    await showFindings(findings);

    expect(screen.getByText(akMT('storeknox.technicalDetailsDescription'))).toBeInTheDocument();

    const chips = document.querySelectorAll('[data-test-sk-third-party-risk-count-chip]');

    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent(`${akMT('storeknox.thirdPartyFinding.potentialRisks')} 2`);
    expect(chips[1]).toHaveTextContent(`${akMT('storeknox.thirdPartyFinding.noRisksDetected')} 1`);
  });

  it('groups findings by category, opened, with each group’s potential-risk count and the known categories’ descriptions', async () => {
    const known = buildSkThirdPartyFinding({
      category: 'control_bypass',
      name: findingName(),
      is_potential_risk: true,
    });

    const custom = buildSkThirdPartyFinding({
      category: 'custom_checks',
      name: findingName(),
      is_potential_risk: false,
    });

    await showFindings([known, custom]);

    const knownGroup = groupOf('Control Bypass');
    const customGroup = groupOf('Custom Checks');

    expect(knownGroup).toHaveAttribute('aria-expanded', 'true');
    expect(customGroup).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(known.name)).toBeInTheDocument();
    expect(screen.getByText(custom.name)).toBeInTheDocument();

    expect(knownGroup).toHaveTextContent('1 potential risk');
    expect(customGroup).toHaveTextContent('0 potential risks');

    expect(customGroup?.querySelector('[data-test-sk-third-party-category-info]')).toBeNull();

    const info = knownGroup?.querySelector('[data-test-sk-third-party-category-info]');

    expect(info).not.toBeNull();

    const description = akMT('storeknox.thirdPartyFinding.categoryDescriptions.controlBypass');

    expect(knownGroup).toHaveAccessibleName(expect.stringContaining(description));
    expect(customGroup).not.toHaveAccessibleName(expect.stringContaining(description));

    await userEvent.hover(info as Element);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(description);
  });

  it('collapses and reopens a group', async () => {
    const finding = buildSkThirdPartyFinding({ category: 'control_bypass', name: findingName() });

    await showFindings([finding]);

    await userEvent.click(groupOf('Control Bypass') as Element);

    await waitFor(() => expect(screen.queryByText(finding.name)).not.toBeInTheDocument());

    await userEvent.click(groupOf('Control Bypass') as Element);

    expect(await screen.findByText(finding.name)).toBeInTheDocument();
  });

  it('orders a group’s findings by severity', async () => {
    const [low, critical, medium] = ['low', 'critical', 'medium'].map((severity) =>
      buildSkThirdPartyFinding({ category: 'control_bypass', severity, name: findingName() })
    );

    await showFindings([low, critical, medium]);

    const rows = Array.from(document.querySelectorAll('[data-test-sk-third-party-finding]'));

    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining(critical.name),
      expect.stringContaining(medium.name),
      expect.stringContaining(low.name),
    ]);
  });

  it('puts findings with no category under Others', async () => {
    const finding = buildSkThirdPartyFinding({ category: null, name: findingName() });

    await showFindings([finding]);

    expect(groupOf('Others')).toBeInTheDocument();
    expect(screen.getByText(finding.name)).toBeInTheDocument();
  });

  it('opens a finding to show what it checks and its findings', async () => {
    const finding = buildSkThirdPartyFinding({
      name: findingName(),
      checks: faker.lorem.sentence(),
      details: [faker.lorem.sentence(), faker.lorem.sentence()],
    });

    await showFindings([finding]);

    expect(screen.queryByText(finding.checks)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: new RegExp(finding.name) }));

    expect(
      await screen.findByText(akMT('storeknox.thirdPartyFinding.whatItChecks'))
    ).toBeInTheDocument();

    expect(screen.getByText(finding.checks)).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.thirdPartyFinding.findings'))).toBeInTheDocument();

    for (const detail of finding.details ?? []) {
      expect(screen.getByText(detail)).toBeInTheDocument();
    }
  });

  it('leaves out what it checks and its findings when the scan sent none', async () => {
    const finding = buildSkThirdPartyFinding({
      name: findingName(),
      checks: '',
      details: [],
      is_potential_risk: true,
      business_impact: '',
    });

    await showFindings([finding]);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(finding.name) }));

    expect(
      screen.queryByText(akMT('storeknox.thirdPartyFinding.whatItChecks'))
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(akMT('storeknox.thirdPartyFinding.findings'))
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(akMT('storeknox.thirdPartyFinding.potentialBusinessImpact'))
    ).not.toBeInTheDocument();
  });

  it('describes a clean finding and gives a potential risk’s business impact instead', async () => {
    const clean = buildSkThirdPartyFinding({
      name: findingName(),
      is_potential_risk: false,
      description: faker.lorem.sentence(),
      business_impact: faker.lorem.sentence(),
    });

    const risky = buildSkThirdPartyFinding({
      name: findingName(),
      is_potential_risk: true,
      description: faker.lorem.sentence(),
      business_impact: faker.lorem.sentence(),
    });

    await showFindings([clean, risky]);

    expect(
      within(screen.getByRole('button', { name: new RegExp(clean.name) })).getByText(
        akMT('storeknox.thirdPartyFinding.noRiskDetected')
      )
    ).toBeInTheDocument();

    expect(
      within(screen.getByRole('button', { name: new RegExp(risky.name) })).getByText(
        akMT('storeknox.thirdPartyFinding.potentialRisk')
      )
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: new RegExp(clean.name) }));

    expect(await screen.findByText(clean.description)).toBeInTheDocument();
    expect(screen.queryByText(clean.business_impact)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: new RegExp(risky.name) }));

    expect(await screen.findByText(risky.business_impact)).toBeInTheDocument();
    expect(screen.queryByText(risky.description)).not.toBeInTheDocument();

    expect(
      screen.getByText(akMT('storeknox.thirdPartyFinding.potentialBusinessImpact'))
    ).toBeInTheDocument();
  });

  it('shows no details when the app has no score', async () => {
    const app = buildUnscoredSkThirdPartyApp();

    setUp(app);
    mockSkThirdPartyApp(app);

    await renderAtRoute(detailsOf(app));
    await screen.findByText(akMT('storeknox.riskAssessmentErrorTitle'));

    expect(screen.queryByText(akMT('storeknox.technicalDetails'))).not.toBeInTheDocument();
  });
});
