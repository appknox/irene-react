import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { VulnerabilityEndpoints } from '@irene/api/services/vulnerability/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  buildAppScan,
  buildRecentIssue,
  buildScanCount,
  buildSession,
  buildVulnerability,
  buildVulnerabilityListResponse,
} from '@tests/factories';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const ANALYTICS = '/dashboard/analytics';

/* A day inside the span the page opens on, so the calendar always has one to draw. */
const THIS_YEAR = new Date(new Date().getFullYear(), 5, 15).toISOString();

/* The organization is whichever one the page selected, so the id is matched rather than named. */
const SCAN_COUNT_URL = '*/api/organizations/*/scancount';
const APP_SCAN_URL = '*/api/organizations/*/appscan';
const RECENT_ISSUES_URL = '*/api/organizations/*/recent_issues';

/** Answers all three analytics endpoints, and reports what the app scan was asked for. */
const serverHasAnalytics = ({
  scanCount = buildScanCount(),
  appScans = [buildAppScan({ created_on_date: THIS_YEAR })],
  issues = [buildRecentIssue()],
} = {}) => {
  const asked = { appScanSearch: '' };

  server.use(
    http.get(SCAN_COUNT_URL, () => HttpResponse.json(scanCount)),

    http.get(APP_SCAN_URL, ({ request }) => {
      asked.appScanSearch = new URL(request.url).search;

      return HttpResponse.json({ results: appScans });
    }),

    http.get(RECENT_ISSUES_URL, () =>
      HttpResponse.json({ count: issues.length, next: null, previous: null, results: issues })
    )
  );

  return { asked, scanCount, appScans, issues };
};

/** Opens the page and waits for its panels. */
const openAnalytics = async () => {
  renderAtRoute(ANALYTICS);

  await screen.findByText(akMT('analyticsModule.appsScannedOverTime'));
};

/** Waits for text the page renders once a request has answered. */
const expectText = (text: string) =>
  waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());

describe('AnalyticsPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({});
  });

  it('renders a panel for each figure the page reports', async () => {
    serverHasAnalytics();

    await openAnalytics();

    await expectText(akMT('analyticsModule.appsScannedOverTime'));
    await expectText(akMT('analyticsModule.mostFoundIssues'));

    await waitFor(() =>
      expect(document.querySelector('[data-test-scan-posture]')).toBeInTheDocument()
    );

    /* The kinds of scan are read in the headline band rather than in a panel of their own. */
    expect(document.querySelector('[data-test-scan-coverage]')).toBeInTheDocument();
  });

  it('names every kind of scan in the headline band, with its own count', async () => {
    const { scanCount } = serverHasAnalytics();

    await openAnalytics();

    await expectText(scanCount.static_scan_count.toLocaleString());
    await expectText(scanCount.dynamic_scan_count.toLocaleString());

    await waitFor(() =>
      expect(document.querySelectorAll('[data-test-scan-coverage-row]')).toHaveLength(4)
    );
  });

  it('leads with the total, and splits it by platform', async () => {
    const { scanCount } = serverHasAnalytics();

    await openAnalytics();

    await expectText(scanCount.total_scan_count.toLocaleString());

    await waitFor(() =>
      expect(document.querySelector('[data-test-platform-split]')).toBeInTheDocument()
    );
  });

  it('draws the scan activity as a calendar of days', async () => {
    serverHasAnalytics();

    await openAnalytics();

    await waitFor(() =>
      expect(document.querySelector('[data-test-scan-activity]')).toBeInTheDocument()
    );
  });

  it('says nothing has been scanned rather than drawing an empty split', async () => {
    serverHasAnalytics({
      scanCount: buildScanCount({
        total_scan_count: 0,
        total_android_scan_count: 0,
        total_ios_scan_count: 0,
      }),
    });

    await openAnalytics();

    await expectText(akMT('analyticsModule.nothingScannedYet'));
  });

  it('asks for the apps scanned over a range, which it opens with', async () => {
    const { asked } = serverHasAnalytics();

    await openAnalytics();

    await waitFor(() => expect(asked.appScanSearch).toContain('start_date='));

    expect(asked.appScanSearch).toContain('end_date=');
  });

  it('says nothing was scanned in a range the server reports none for', async () => {
    serverHasAnalytics({ appScans: [] });

    await openAnalytics();

    await waitFor(() =>
      expect(document.querySelectorAll('[data-test-analytics-empty]').length).toBeGreaterThan(0)
    );

    expect(document.querySelector('[data-test-analytics-empty]')).toHaveTextContent(
      akMT('analyticsModule.nothingScannedInRange')
    );
  });

  it('draws the issues it was given as a chart, which names them in the catalogue', async () => {
    const vulnerability = buildVulnerability({ types: [ENUMS.VULNERABILITY_TYPE.STATIC] });

    server.use(
      http.get(`*/${VulnerabilityEndpoints.list()}`, () =>
        HttpResponse.json(buildVulnerabilityListResponse([vulnerability]))
      )
    );

    serverHasAnalytics({
      issues: [buildRecentIssue({ id: vulnerability.id, vulnerability: vulnerability.id })],
    });

    await openAnalytics();

    /* The names and counts are painted into a canvas, so the chart is what is observable here. */
    await waitFor(() =>
      expect(
        document.querySelector(`[aria-label="${akMT('analyticsModule.mostFoundIssues')}"]`)
      ).toBeInTheDocument()
    );
  });

  it('says nothing has been scanned when no kind of scan has run', async () => {
    serverHasAnalytics({
      scanCount: buildScanCount({
        static_scan_count: 0,
        dynamic_scan_count: 0,
        api_scan_count: 0,
        manual_scan_count: 0,
      }),
    });

    await openAnalytics();

    await waitFor(() =>
      expect(document.querySelector('[data-test-scan-coverage]')).not.toBeInTheDocument()
    );
  });

  it('says no issues were found when the server reports none', async () => {
    serverHasAnalytics({ issues: [] });

    await openAnalytics();

    await expectText(akMT('analyticsModule.noIssuesFound'));
  });

  it('reads the apps scanned again when the range is set from a shortcut', async () => {
    const { asked } = serverHasAnalytics();

    await openAnalytics();

    await waitFor(() => expect(asked.appScanSearch).toContain('start_date='));

    const opened = asked.appScanSearch;
    const trigger = document.querySelector('[data-test-date-range-picker-trigger]');

    await userEvent.click(trigger as HTMLElement);

    const shortcut = await screen.findByText(akMT('analyticsModule.last3Months'));

    await userEvent.click(shortcut);

    await waitFor(() => expect(asked.appScanSearch).not.toBe(opened));
  });
});
