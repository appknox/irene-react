import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { SavedReportEndpoints, SavedReportService } from '@irene/api/services/saved-report';
import {
  buildSavedReport,
  buildSavedReportPreview,
  buildSavedReportSnapshot,
  buildSavedReportSummary,
} from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const LIST_URL = buildAPITestURL(SavedReportEndpoints.list());

/** Records the JSON body a handler receives, and answers with reply. */
const capture = (reply: () => Response) => {
  const seen: { body?: unknown } = {};

  return {
    seen,
    resolver: async ({ request }: { request: Request }) => {
      seen.body = request.headers.get('content-length') === '0' ? undefined : await request.json();

      return reply();
    },
  };
};

describe('SavedReportService.getSavedReports', () => {
  it('asks for one page, with the search when there is one, and keeps the per-account maximum', async () => {
    const reports = [buildSavedReportSummary(), buildSavedReportSummary()];
    let query: URLSearchParams | undefined;

    server.use(
      http.get(LIST_URL, ({ request }) => {
        query = new URL(request.url).searchParams;

        return HttpResponse.json({ count: 2, next: null, previous: null, results: reports, max_saved_reports: 50 });
      })
    );

    const page = await SavedReportService.getSavedReports({ search: 'critical', limit: 20, offset: 40 });

    expect(page.items).toEqual(reports);
    expect(page.maxSavedReports).toBe(50);
    expect(query?.get('search')).toBe('critical');
    expect(query?.get('limit')).toBe('20');
    expect(query?.get('offset')).toBe('40');
  });

  it('leaves the search out when it is empty', async () => {
    let query: URLSearchParams | undefined;

    server.use(
      http.get(LIST_URL, ({ request }) => {
        query = new URL(request.url).searchParams;

        return HttpResponse.json({ count: 0, next: null, previous: null, results: [], max_saved_reports: 50 });
      })
    );

    await SavedReportService.getSavedReports({ search: '', limit: 20, offset: 0 });

    expect(query?.has('search')).toBe(false);
  });
});

describe('SavedReportService one report', () => {
  const report = buildSavedReport();
  const detailUrl = buildAPITestURL(SavedReportEndpoints.detail(report.id));

  it('reads the report', async () => {
    server.use(http.get(detailUrl, () => HttpResponse.json(report)));

    await expect(SavedReportService.getSavedReport(report.id)).resolves.toEqual(report);
  });

  it('saves a generated report with its name', async () => {
    const { seen, resolver } = capture(() => HttpResponse.json(report, { status: HTTP_STATUS_CODES.CREATED }));

    server.use(http.post(LIST_URL, resolver));

    await SavedReportService.saveReport({ report_request: report.report_request, name: report.name });

    expect(seen.body).toEqual({ report_request: report.report_request, name: report.name });
  });

  it('sends only the fields that change', async () => {
    const { seen, resolver } = capture(() => HttpResponse.json(report));

    server.use(http.patch(detailUrl, resolver));

    await SavedReportService.updateSavedReport(report.id, { pinned: true });

    expect(seen.body).toEqual({ pinned: true });
  });

  it('saves a copy under a new name with the view on screen', async () => {
    const { seen, resolver } = capture(() => HttpResponse.json(report, { status: HTTP_STATUS_CODES.CREATED }));
    const body = { name: 'Copy', view_config: { columns: ['app'] } };

    server.use(http.post(buildAPITestURL(SavedReportEndpoints.copy(report.id)), resolver));

    await expect(SavedReportService.copySavedReport(report.id, body)).resolves.toEqual(report);
    expect(seen.body).toEqual(body);
  });

  it('deletes and restores', async () => {
    let deleted = false;

    server.use(
      http.delete(detailUrl, () => {
        deleted = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      }),
      http.post(buildAPITestURL(SavedReportEndpoints.restore(report.id)), () => HttpResponse.json(report))
    );

    await SavedReportService.deleteSavedReport(report.id);
    await expect(SavedReportService.restoreSavedReport(report.id)).resolves.toEqual(report);
    expect(deleted).toBe(true);
  });

  it('asks for a refresh and returns the rows’ state', async () => {
    const snapshot = buildSavedReportSnapshot({ status: 'refreshing' });

    server.use(
      http.post(buildAPITestURL(SavedReportEndpoints.refresh(report.id)), () =>
        HttpResponse.json(snapshot, { status: HTTP_STATUS_CODES.ACCEPTED })
      )
    );

    await expect(SavedReportService.refreshSavedReport(report.id)).resolves.toEqual(snapshot);
  });

  it('posts the page and filters for a preview', async () => {
    const preview = buildSavedReportPreview(report);
    const { seen, resolver } = capture(() => HttpResponse.json(preview));

    server.use(http.post(buildAPITestURL(SavedReportEndpoints.preview(report.id)), resolver));

    await expect(SavedReportService.previewSavedReport(report.id, { limit: 10, offset: 20 })).resolves.toEqual(
      preview
    );

    expect(seen.body).toEqual({ limit: 10, offset: 20 });
  });

  it('asks for the file in the chosen format and returns its link', async () => {
    const { seen, resolver } = capture(() => HttpResponse.json({ url: 'https://files.example/r.xlsx' }));

    server.use(http.post(buildAPITestURL(SavedReportEndpoints.downloadUrl(report.id)), resolver));

    await expect(SavedReportService.getSavedReportDownloadUrl(report.id, { report_type: 'xlsx' })).resolves.toBe(
      'https://files.example/r.xlsx'
    );

    expect(seen.body).toEqual({ report_type: 'xlsx' });
  });
});
