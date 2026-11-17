import { http, HttpResponse } from 'msw';

import type { ApiReportPreview, ApiReportRequest } from '@irene/api/services/report-request';
import {
  OrganizationAiSettingsEndpoints,
  ReportRequestEndpoints,
} from '@irene/api/services/report-request/endpoints';
import type { ApiSavedReport, ApiSavedReportSummary } from '@irene/api/services/saved-report';
import { SavedReportEndpoints } from '@irene/api/services/saved-report/endpoints';

import { buildReportPreview, buildSavedReportPreview } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { buildAPITestURL, server } from '@tests/server';

/** Every request body a handler received, in order. */
export type SeenBodies = unknown[];

/**
 * Signs into an organization with AI reporting, its own AI setting switched
 * on, and (unless asked otherwise) saved reports with an empty list.
 *
 * @param options.savedReports - Whether the organization has saved reports.
 * @param options.reportingSetting - The organization's own AI reporting setting.
 */
export function mockReporting({ savedReports = true, reportingSetting = true } = {}) {
  mockOrganizationFeatures({}, { reporting: true, saved_reports: savedReports });

  server.use(
    http.get(`*/${OrganizationAiSettingsEndpoints.detail('ORG').replace('ORG', ':id')}`, () =>
      HttpResponse.json({ reporting: reportingSetting, pii: false })
    )
  );

  mockSavedReportList([]);
}

/**
 * Answers the Saved reports list with these reports.
 *
 * @param reports - The reports the account has.
 * @returns The searches it was asked for.
 */
export function mockSavedReportList(reports: ApiSavedReportSummary[]) {
  const searches: (string | null)[] = [];

  server.use(
    http.get(buildAPITestURL(SavedReportEndpoints.list()), ({ request }) => {
      searches.push(new URL(request.url).searchParams.get('search'));

      return HttpResponse.json({
        count: reports.length,
        next: null,
        previous: null,
        results: reports,
        max_saved_reports: 50,
      });
    })
  );

  return searches;
}

/**
 * Answers a report request and its preview.
 *
 * @param request - The request.
 * @param preview - The page its preview answers with.
 * @returns The preview request bodies received.
 */
export function mockReportRequest(request: ApiReportRequest, preview: ApiReportPreview = buildReportPreview()) {
  const bodies: SeenBodies = [];

  server.use(
    http.get(buildAPITestURL(ReportRequestEndpoints.detail(request.id)), () => HttpResponse.json(request)),
    http.post(buildAPITestURL(ReportRequestEndpoints.preview(request.id)), async ({ request: sent }) => {
      bodies.push(await sent.json());

      return HttpResponse.json(preview);
    })
  );

  return bodies;
}

/**
 * Answers a saved report and its preview.
 *
 * @param report - The report.
 * @returns The preview request bodies received.
 */
export function mockSavedReport(report: ApiSavedReport) {
  const bodies: SeenBodies = [];

  server.use(
    http.get(buildAPITestURL(SavedReportEndpoints.detail(report.id)), () => HttpResponse.json(report)),
    http.post(buildAPITestURL(SavedReportEndpoints.preview(report.id)), async ({ request }) => {
      bodies.push(await request.json());

      return HttpResponse.json(buildSavedReportPreview(report));
    })
  );

  return bodies;
}

/** A Luna refusal, worded for the reader. */
export const lunaRefusal = (message: string, status = 400) =>
  HttpResponse.json({ error: true, message, status_code: status }, { status });
