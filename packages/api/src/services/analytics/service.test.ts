import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AnalyticsEndpoints, AnalyticsService } from '@irene/api/services/analytics';
import { storeSession } from '@irene/api/utils/session';
import { buildAppScan, buildRecentIssue, buildScanCount, buildSession } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const ORGANIZATION_ID = 42;

const scanCountUrl = buildAPITestURL(AnalyticsEndpoints.scanCount(ORGANIZATION_ID));
const appScanUrl = buildAPITestURL(AnalyticsEndpoints.appScan(ORGANIZATION_ID));
const recentIssuesUrl = buildAPITestURL(AnalyticsEndpoints.recentIssues(ORGANIZATION_ID));

storeSession(buildSession());

describe('AnalyticsService.getScanCount', () => {
  it('reads what the organization has scanned', async () => {
    const scanCount = buildScanCount();

    server.use(http.get(scanCountUrl, () => HttpResponse.json(scanCount)));

    await expect(AnalyticsService.getScanCount(ORGANIZATION_ID)).resolves.toEqual(scanCount);
  });
});

describe('AnalyticsService.getAppScans', () => {
  it('narrows the apps to the range it is given', async () => {
    const asked = { search: '' };
    const appScan = buildAppScan();

    server.use(
      http.get(appScanUrl, ({ request }) => {
        asked.search = new URL(request.url).search;

        return HttpResponse.json({ results: [appScan] });
      })
    );

    const scans = await AnalyticsService.getAppScans(ORGANIZATION_ID, {
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: '2026-06-01T00:00:00.000Z',
    });

    expect(scans).toEqual([appScan]);
    expect(asked.search).toContain('start_date=2026-01-01');
    expect(asked.search).toContain('end_date=2026-06-01');
  });

  it('unwraps the results, which this endpoint does not paginate', async () => {
    server.use(http.get(appScanUrl, () => HttpResponse.json({ results: [] })));

    await expect(
      AnalyticsService.getAppScans(ORGANIZATION_ID, { start_date: '', end_date: '' })
    ).resolves.toEqual([]);
  });
});

describe('AnalyticsService.getRecentIssues', () => {
  it('reads one page of the commonest vulnerabilities', async () => {
    const issue = buildRecentIssue();

    server.use(
      http.get(recentIssuesUrl, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [issue] })
      )
    );

    const page = await AnalyticsService.getRecentIssues(ORGANIZATION_ID, { limit: 10, offset: 0 });

    expect(page.items).toEqual([issue]);
    expect(page.count).toBe(1);
  });
});
