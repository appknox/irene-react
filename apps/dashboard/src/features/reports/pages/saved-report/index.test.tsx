import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { SavedReportEndpoints } from '@irene/api/services/saved-report/endpoints';
import type { ApiSavedReport } from '@irene/api/services/saved-report';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSavedReport, buildSavedReportSnapshot, buildSavedReportSummary, buildSession } from '@tests/factories';
import { lunaRefusal, mockReporting, mockSavedReport, mockSavedReportList } from '@tests/reports';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const openReport = (report: ApiSavedReport) => renderAtRoute(`/dashboard/reports/saved/${report.id}`);

/** Hides the report's first column, which leaves the report with unsaved changes. */
const hideFirstColumn = async (report: ApiSavedReport) => {
  await userEvent.click(await screen.findByRole('button', { name: /Selected Columns · 2/ }));

  await userEvent.click(
    within(await screen.findByRole('dialog')).getByRole('checkbox', { name: report.columns[0]?.label })
  );

  await userEvent.keyboard('{Escape}');
};

const unsavedChip = () =>
  akMT('reportModule.view.unsavedChanges', {
    summary: akMT('reportModule.view.columnsHidden', { count: 1 }),
  });

describe('SavedReportPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockReporting();
  });

  it('shows the saved report as saved', async () => {
    const report = buildSavedReport();

    mockSavedReport(report);
    await openReport(report);

    expect(await screen.findByRole('heading', { name: report.name })).toBeInTheDocument();
    expect(screen.getByText(report.query)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('reportModule.view.saved') })).toBeDisabled();
  });

  it('opens with the saved columns and filters', async () => {
    const filters = [{ id: 'report', filter_details: { app: { operator: 'icontains', value: 'shop' } } }];
    const report = buildSavedReport({ view_config: { columns: ['findings'], filters } });
    const previews = mockSavedReport(report);

    await openReport(report);

    expect(await screen.findByRole('button', { name: /Selected Columns · 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Advanced Filters · 1/ })).toBeInTheDocument();
    await waitFor(() => expect(previews[0]).toEqual({ limit: 10, offset: 0, filter_details: filters }));
  });

  it('says what changed, and saves it over the report', async () => {
    const report = buildSavedReport();
    let body: unknown;

    mockSavedReport(report);

    server.use(
      http.patch(buildAPITestURL(SavedReportEndpoints.detail(report.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ ...report, view_config: { columns: ['findings'], filters: [] } });
      })
    );

    await openReport(report);
    await hideFirstColumn(report);

    expect(await screen.findByText(unsavedChip())).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('reportModule.view.saveChanges') }));

    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(akMT('reportModule.view.columnsHidden', { count: 1 }))).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: akMT('reportModule.view.updateReport') }));

    await waitFor(() =>
      expect(body).toEqual({ view_config: { version: 1, columns: ['findings'], filters: [], chart: null } })
    );

    expect(await screen.findByRole('button', { name: akMT('reportModule.view.saved') })).toBeDisabled();
  });

  it('saves the changes as a new report and opens it', async () => {
    const report = buildSavedReport();
    const copy = buildSavedReport({ name: `${report.name} (2)` });
    let body: unknown;

    mockSavedReport(report);
    mockSavedReport(copy);

    server.use(
      http.post(buildAPITestURL(SavedReportEndpoints.copy(report.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(copy, { status: HTTP_STATUS_CODES.CREATED });
      })
    );

    await openReport(report);
    await hideFirstColumn(report);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.view.saveChanges') }));

    const drawer = await screen.findByRole('dialog');

    await userEvent.click(within(drawer).getByRole('radio', { name: new RegExp(akMT('reportModule.view.saveAsNew')) }));
    await userEvent.click(within(drawer).getByRole('button', { name: akMT('reportModule.view.saveAsNew') }));

    expect(await screen.findByRole('heading', { name: copy.name })).toBeInTheDocument();
    expect(body).toMatchObject({ name: copy.name, view_config: { columns: ['findings'] } });
  });

  it('discards the changes from the menu', async () => {
    const report = buildSavedReport();

    mockSavedReport(report);
    await openReport(report);
    await hideFirstColumn(report);
    await screen.findByText(unsavedChip());

    await userEvent.click(screen.getByRole('button', { name: akMT('reportModule.view.moreActions') }));
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('reportModule.view.discardChanges') }));

    expect(await screen.findByRole('button', { name: akMT('reportModule.view.saved') })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: report.columns[0]?.label })).toBeInTheDocument();
  });

  it('asks before leaving with unsaved changes', async () => {
    const report = buildSavedReport();

    mockSavedReport(report);
    await openReport(report);
    await hideFirstColumn(report);
    await screen.findByText(unsavedChip());

    await userEvent.click(screen.getByRole('link', { name: akMT('reportModule.aiGenerateEngine') }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(akMT('reportModule.view.unsavedTitle'))).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: akMT('reportModule.view.keepEditing') }));

    expect(screen.getByRole('heading', { name: report.name })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: akMT('reportModule.aiGenerateEngine') }));

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: akMT('reportModule.view.leaveWithoutSaving'),
      })
    );

    expect(await screen.findByText(akMT('reportModule.describeTheReport'))).toBeInTheDocument();
  });

  it('refreshes the data and shows it is refreshing', async () => {
    const report = buildSavedReport();
    let asked = false;

    mockSavedReport(report);

    server.use(
      http.post(buildAPITestURL(SavedReportEndpoints.refresh(report.id)), () => {
        asked = true;

        return HttpResponse.json(buildSavedReportSnapshot({ status: 'refreshing' }), {
          status: HTTP_STATUS_CODES.ACCEPTED,
        });
      })
    );

    await openReport(report);
    await userEvent.click(await screen.findByRole('button', { name: akMT('refresh') }));

    expect(await screen.findByText(akMT('reportModule.savedReports.refreshing'))).toBeInTheDocument();
    expect(asked).toBe(true);
  });

  it('says why the last refresh failed', async () => {
    const error = 'The data could not be refreshed. Try again in a few minutes.';
    const report = buildSavedReport({ snapshot: buildSavedReportSnapshot({ status: 'failed', error }) });

    mockSavedReport(report);
    await openReport(report);

    expect(await screen.findByText(akMT('reportModule.savedReports.refreshFailed'))).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('pins the report from the menu', async () => {
    const report = buildSavedReport({ pinned: false });
    let body: unknown;

    mockSavedReport(report);

    server.use(
      http.patch(buildAPITestURL(SavedReportEndpoints.detail(report.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ ...report, pinned: true });
      })
    );

    await openReport(report);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.view.moreActions') }));
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('reportModule.savedReports.pin') }));

    await waitFor(() => expect(body).toEqual({ pinned: true }));
  });

  it('deletes the report and goes back to Generate', async () => {
    const report = buildSavedReport();

    mockSavedReport(report);

    server.use(
      http.delete(
        buildAPITestURL(SavedReportEndpoints.detail(report.id)),
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT })
      )
    );

    await openReport(report);
    await userEvent.click(await screen.findByRole('button', { name: akMT('reportModule.view.moreActions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', { name: akMT('reportModule.savedReports.deleteReport') })
    );

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: akMT('reportModule.savedReports.deleteReport'),
      })
    );

    expect(await screen.findByText(akMT('reportModule.describeTheReport'))).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: akMT('undo') })).toBeInTheDocument();
  });

  it('says a report that is gone is not available, with the way to Generate', async () => {
    const report = buildSavedReport();

    server.use(
      http.get(buildAPITestURL(SavedReportEndpoints.detail(report.id)), () =>
        lunaRefusal('This report isn’t available.', HTTP_STATUS_CODES.NOT_FOUND)
      )
    );

    await openReport(report);

    expect(await screen.findByText(akMT('reportModule.savedReports.notAvailableTitle'))).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('reportModule.view.generateAReport') })).toHaveAttribute(
      'href',
      '/dashboard/reports/generate'
    );
  });

  it('marks the open report in the panel', async () => {
    const report = buildSavedReport();

    mockSavedReport(report);
    mockSavedReportList([buildSavedReportSummary({ ...report }), buildSavedReportSummary()]);
    await openReport(report);

    const panel = await screen.findByRole('complementary', { name: akMT('reportModule.savedReports.title') });

    expect(await within(panel).findByRole('link', { current: 'page' })).toHaveTextContent(report.name);
  });
});
