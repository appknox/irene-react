import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportRequestEndpoints } from '@irene/api/services/report-request/endpoints';
import { SavedReportEndpoints } from '@irene/api/services/saved-report/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildReportPreview,
  buildReportRequest,
  buildSavedReport,
  buildSavedReportSummary,
  buildSession,
} from '@tests/factories';

import { lunaRefusal, mockReporting, mockReportRequest, mockSavedReport, mockSavedReportList } from '@tests/reports';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const openRequest = (id: number) => renderAtRoute(`/dashboard/reports/preview/${id}`);

/** Stands in for the browser's location, so a test can read where the page sent it. */
const stubLocation = () => {
  const location = { ...window.location };

  vi.spyOn(window, 'location', 'get').mockReturnValue(location);

  return location;
};

describe('ReportRequestPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockReporting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the report: title, question, default columns, rows and chart', async () => {
    const request = buildReportRequest();
    const preview = buildReportPreview();

    mockReportRequest(request, preview);
    await openRequest(request.id);

    expect(await screen.findByRole('heading', { name: preview.title })).toBeInTheDocument();
    expect(screen.getByText(request.query)).toBeInTheDocument();
    expect(screen.getByText(String(preview.data[0]?.app))).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: preview.columns[3]?.label })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: akMT('reportModule.view.visualization') })).toBeInTheDocument();
    expect(screen.getByText(akMT('reportModule.view.notSavedYet'))).toBeInTheDocument();
  });

  it('asks to rephrase a question that could not be answered, without fetching rows', async () => {
    const request = buildReportRequest({ is_relevant: false, error: false });
    const previews = mockReportRequest(request);

    await openRequest(request.id);

    expect(await screen.findByText(akMT('reportModule.rephrasingErrorHeader'))).toBeInTheDocument();
    expect(previews).toHaveLength(0);
  });

  it('says when generating failed, with Luna’s reason', async () => {
    const request = buildReportRequest({ is_relevant: false, error: true, error_message: 'Try naming the app.' });

    mockReportRequest(request);
    await openRequest(request.id);

    expect(await screen.findByText(akMT('reportModule.somethingWentWrongHeader'))).toBeInTheDocument();
    expect(screen.getByText('Try naming the app.')).toBeInTheDocument();
  });

  it('says a request that is not the account’s is not available', async () => {
    server.use(
      http.get(buildAPITestURL(ReportRequestEndpoints.detail(5)), () =>
        lunaRefusal('Report request not found', HTTP_STATUS_CODES.NOT_FOUND)
      )
    );

    await openRequest(5);

    expect(await screen.findByText(akMT('reportModule.savedReports.notAvailableTitle'))).toBeInTheDocument();
  });

  it('says when no rows match', async () => {
    const request = buildReportRequest();

    mockReportRequest(request, buildReportPreview({}, []));
    await openRequest(request.id);

    expect(await screen.findByText(akMT('noResultsFound'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('downloadReport') })).toBeDisabled();
  });

  it('hides a column at once, and keeps at least one on', async () => {
    const request = buildReportRequest();
    const preview = buildReportPreview();
    const [first] = preview.columns;

    mockReportRequest(request, preview);
    await openRequest(request.id);

    await userEvent.click(await screen.findByRole('button', { name: /Selected Columns · 3/ }));

    const popover = await screen.findByRole('dialog');

    await userEvent.click(within(popover).getByRole('checkbox', { name: first?.label }));

    expect(screen.queryByRole('columnheader', { name: first?.label })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Selected Columns · 2/ })).toBeInTheDocument();
  });

  it('filters the rows through Luna', async () => {
    const request = buildReportRequest();
    const previews = mockReportRequest(request);

    await openRequest(request.id);
    await userEvent.click(await screen.findByRole('button', { name: /Advanced Filters · 0/ }));

    const popover = await screen.findByRole('dialog');

    await userEvent.type(within(popover).getByRole('textbox'), 'shop');
    await userEvent.click(within(popover).getByRole('button', { name: akMT('reportModule.view.applyFilters') }));

    await waitFor(() =>
      expect(previews.at(-1)).toEqual({
        limit: 10,
        offset: 0,
        filter_details: [{ id: 'report', filter_details: { app: { operator: 'icontains', value: 'shop' } } }],
      })
    );

    expect(await screen.findByRole('button', { name: /Advanced Filters · 1/ })).toBeInTheDocument();
  });

  it('downloads the shown columns with the filters, in the chosen format', async () => {
    const request = buildReportRequest({ report_type: 'csv' });
    let body: unknown;

    mockReportRequest(request);

    server.use(
      http.post(buildAPITestURL(ReportRequestEndpoints.downloadUrl(request.id)), async ({ request: sent }) => {
        body = await sent.json();

        return HttpResponse.json({ url: 'https://api.example.com/download?cache_key=k' });
      })
    );

    await openRequest(request.id);
    await userEvent.click(await screen.findByRole('button', { name: akMT('downloadReport') }));

    const location = stubLocation();

    await userEvent.click(await screen.findByRole('button', { name: akMT('download') }));

    await waitFor(() => expect(location.href).toBe('https://api.example.com/download?cache_key=k'));
    expect(body).toMatchObject({ report_type: 'csv', filter_details: [] });
  });

  it('saves the report with the view on screen and opens it', async () => {
    const request = buildReportRequest();
    const preview = buildReportPreview();
    const saved = buildSavedReport({ name: preview.title, report_request: request.id });
    let body: unknown;

    mockReportRequest(request, preview);
    mockSavedReport(saved);

    server.use(
      http.post(buildAPITestURL(SavedReportEndpoints.list()), async ({ request: sent }) => {
        body = await sent.json();

        return HttpResponse.json(saved, { status: HTTP_STATUS_CODES.CREATED });
      })
    );

    await openRequest(request.id);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.savedReports.saveReport') }));

    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByRole('textbox', { name: akMT('name') })).toHaveValue(preview.title);

    await userEvent.click(within(drawer).getByRole('button', { name: akMT('reportModule.savedReports.saveReport') }));

    expect(await screen.findByRole('heading', { name: saved.name })).toBeInTheDocument();

    expect(body).toEqual({
      report_request: request.id,
      name: preview.title,
      view_config: { version: 1, columns: ['app', 'severity', 'findings'], filters: [], chart: null },
    });
  });

  it('numbers the suggested name when a saved report has it', async () => {
    const request = buildReportRequest();
    const preview = buildReportPreview();

    mockReportRequest(request, preview);
    mockSavedReportList([buildSavedReportSummary({ name: preview.title })]);

    await openRequest(request.id);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.savedReports.saveReport') }));

    expect(within(await screen.findByRole('dialog')).getByRole('textbox')).toHaveValue(`${preview.title} (2)`);
  });

  it('shows Luna’s refusal under the name', async () => {
    const request = buildReportRequest();
    const message = 'You have 50 saved reports, the most you can keep.';

    mockReportRequest(request);
    server.use(http.post(buildAPITestURL(SavedReportEndpoints.list()), () => lunaRefusal(message)));

    await openRequest(request.id);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.savedReports.saveReport') }));

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: akMT('reportModule.savedReports.saveReport') })
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('offers no saving where the organization has no saved reports', async () => {
    const request = buildReportRequest();
    const preview = buildReportPreview();

    mockReporting({ savedReports: false });
    mockReportRequest(request, preview);
    await openRequest(request.id);

    await screen.findByRole('heading', { name: preview.title });

    expect(screen.queryByRole('button', { name: akMT('reportModule.savedReports.saveReport') })).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('reportModule.view.notSavedYet'))).not.toBeInTheDocument();
  });
});
