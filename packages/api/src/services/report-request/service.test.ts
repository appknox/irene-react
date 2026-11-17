import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  OrganizationAiSettingsEndpoints,
  ReportRequestEndpoints,
  ReportRequestService,
} from '@irene/api/services/report-request';
import { buildReportPreview, buildReportRequest } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

describe('ReportRequestService', () => {
  const request = buildReportRequest();

  it('asks for a report with the question alone', async () => {
    let body: unknown;

    server.use(
      http.post(buildAPITestURL(ReportRequestEndpoints.list()), async ({ request: sent }) => {
        body = await sent.json();

        return HttpResponse.json(request);
      })
    );

    await expect(ReportRequestService.createReportRequest(request.query)).resolves.toEqual(request);
    expect(body).toEqual({ query: request.query });
  });

  it('reads a request', async () => {
    server.use(http.get(buildAPITestURL(ReportRequestEndpoints.detail(request.id)), () => HttpResponse.json(request)));

    await expect(ReportRequestService.getReportRequest(request.id)).resolves.toEqual(request);
  });

  it('posts the page and filters for a preview', async () => {
    const preview = buildReportPreview();
    const filters = [{ id: 'report', filter_details: { severity: 'High' } }];
    let body: unknown;

    server.use(
      http.post(buildAPITestURL(ReportRequestEndpoints.preview(request.id)), async ({ request: sent }) => {
        body = await sent.json();

        return HttpResponse.json(preview);
      })
    );

    await expect(
      ReportRequestService.previewReportRequest(request.id, { limit: 10, offset: 0, filter_details: filters })
    ).resolves.toEqual(preview);

    expect(body).toEqual({ limit: 10, offset: 0, filter_details: filters });
  });

  it('asks for a file with the columns, format and filters, and returns its link', async () => {
    const download = { columns: [{ field: 'app', label: 'App' }], report_type: 'csv' as const };
    let body: unknown;

    server.use(
      http.post(buildAPITestURL(ReportRequestEndpoints.downloadUrl(request.id)), async ({ request: sent }) => {
        body = await sent.json();

        return HttpResponse.json({ url: 'https://files.example/r.csv' });
      })
    );

    await expect(ReportRequestService.getReportDownloadUrl(request.id, download)).resolves.toBe(
      'https://files.example/r.csv'
    );

    expect(body).toEqual(download);
  });

  it('reads the organization’s AI settings', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationAiSettingsEndpoints.detail(7)), () =>
        HttpResponse.json({ reporting: true, pii: false })
      )
    );

    await expect(ReportRequestService.getOrganizationAiSettings(7)).resolves.toEqual({ reporting: true, pii: false });
  });
});
