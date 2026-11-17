import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { SavedReportEndpoints } from '@irene/api/services/saved-report/endpoints';
import type { ApiSavedReportSummary } from '@irene/api/services/saved-report';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSavedReport, buildSavedReportSummary, buildSession } from '@tests/factories';
import { lunaRefusal, mockReporting, mockSavedReportList } from '@tests/reports';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

import { SAVED_REPORTS_PANEL_KEY } from './use-panel-open';

const GENERATE = '/dashboard/reports/generate';

const panel = () => screen.findByRole('complementary', { name: akMT('reportModule.savedReports.title') });

/** The row of a report in the panel. */
const rowOf = async (report: ApiSavedReportSummary) => {
  const row = (await within(await panel()).findByText(report.name)).closest('li');

  if (!row) {
    throw new Error(`No row for ${report.name}`);
  }

  return row;
};

const openRowMenu = async (report: ApiSavedReportSummary) =>
  userEvent.click(
    within(await rowOf(report)).getByRole('button', {
      name: akMT('reportModule.savedReports.moreFor', { name: report.name }),
    })
  );

describe('SavedReportsPanel', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockReporting();
    localStorage.removeItem(SAVED_REPORTS_PANEL_KEY);
  });

  it('groups pinned reports on top and the rest by when they changed', async () => {
    const pinned = buildSavedReportSummary({ pinned: true, name: 'Pinned one' });
    const today = buildSavedReportSummary({ updated_on: new Date().toISOString(), name: 'Today one' });
    const old = buildSavedReportSummary({ updated_on: new Date(2020, 0, 1).toISOString(), name: 'Old one' });

    mockSavedReportList([pinned, today, old]);
    await renderAtRoute(GENERATE);

    const sections = within(await panel()).getAllByRole('region');

    expect(sections.map((section) => section.getAttribute('aria-label'))).toEqual([
      akMT('reportModule.savedReports.groups.pinned'),
      akMT('reportModule.savedReports.groups.today'),
      akMT('reportModule.savedReports.groups.older'),
    ]);

    expect(within(sections[0] as HTMLElement).getByText(pinned.name)).toBeInTheDocument();
  });

  it('says whether each report has a chart', async () => {
    const charted = buildSavedReportSummary({ has_chart: true });
    const tableOnly = buildSavedReportSummary({ has_chart: false });

    mockSavedReportList([charted, tableOnly]);
    await renderAtRoute(GENERATE);

    expect(within(await rowOf(charted)).getByText(new RegExp(akMT('reportModule.savedReports.tableAndChart').replace('+', '\\+')))).toBeInTheDocument();
    expect(within(await rowOf(tableOnly)).getByText(new RegExp(`^${akMT('reportModule.savedReports.tableOnly')} ·`))).toBeInTheDocument();
  });

  it('searches the reports', async () => {
    const searches = mockSavedReportList([]);

    await renderAtRoute(GENERATE);

    await userEvent.type(
      within(await panel()).getByRole('searchbox', { name: akMT('reportModule.savedReports.searchLabel') }),
      'audit'
    );

    expect(
      await screen.findByText(akMT('reportModule.savedReports.noMatchTitle', { search: 'audit' }))
    ).toBeInTheDocument();

    expect(searches).toContain('audit');
  });

  it('explains how to save a report while there are none', async () => {
    await renderAtRoute(GENERATE);

    expect(await within(await panel()).findByText(akMT('reportModule.savedReports.emptyTitle'))).toBeInTheDocument();
  });

  it('offers to try again when the list fails', async () => {
    server.use(http.get(buildAPITestURL(SavedReportEndpoints.list()), () => lunaRefusal('down', 500)));

    await renderAtRoute(GENERATE);

    expect(
      await within(await panel()).findByText(akMT('reportModule.savedReports.loadFailedTitle'), {}, { timeout: 5000 })
    ).toBeInTheDocument();
  });

  it('renames a report in place', async () => {
    const report = buildSavedReportSummary();
    let body: unknown;

    mockSavedReportList([report]);

    server.use(
      http.patch(buildAPITestURL(SavedReportEndpoints.detail(report.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(buildSavedReport({ ...report, name: 'Weekly apps' }));
      })
    );

    await renderAtRoute(GENERATE);
    await openRowMenu(report);
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('reportModule.savedReports.renameShort') }));

    const field = await screen.findByRole('textbox', { name: akMT('reportModule.savedReports.reportName') });

    await userEvent.clear(field);
    await userEvent.type(field, 'Weekly apps{Enter}');

    await waitFor(() => expect(body).toEqual({ name: 'Weekly apps' }));
  });

  it('leaves the name alone when the rename is cancelled', async () => {
    const report = buildSavedReportSummary();

    mockSavedReportList([report]);
    await renderAtRoute(GENERATE);
    await openRowMenu(report);
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('reportModule.savedReports.renameShort') }));

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('reportModule.savedReports.reportName') }),
      ' draft{Escape}'
    );

    expect(await within(await panel()).findByText(report.name)).toBeInTheDocument();
  });

  it('pins a report from its menu', async () => {
    const report = buildSavedReportSummary({ pinned: false });
    let body: unknown;

    mockSavedReportList([report]);

    server.use(
      http.patch(buildAPITestURL(SavedReportEndpoints.detail(report.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(buildSavedReport({ ...report, pinned: true }));
      })
    );

    await renderAtRoute(GENERATE);
    await openRowMenu(report);
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('reportModule.savedReports.pin') }));

    await waitFor(() => expect(body).toEqual({ pinned: true }));
  });

  it('deletes a report after confirming', async () => {
    const report = buildSavedReportSummary();
    let deleted = false;

    mockSavedReportList([report]);

    server.use(
      http.delete(buildAPITestURL(SavedReportEndpoints.detail(report.id)), () => {
        deleted = true;
        mockSavedReportList([]);

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await renderAtRoute(GENERATE);
    await openRowMenu(report);
    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('delete') }));

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: akMT('reportModule.savedReports.deleteReport'),
      })
    );

    await waitFor(() => expect(deleted).toBe(true));
    expect(await within(await panel()).findByText(akMT('reportModule.savedReports.emptyTitle'))).toBeInTheDocument();
  });

  it('folds away to a rail with the count, and stays folded', async () => {
    mockSavedReportList([buildSavedReportSummary(), buildSavedReportSummary()]);

    await renderAtRoute(GENERATE);

    await userEvent.click(
      within(await panel()).getByRole('button', { name: akMT('reportModule.savedReports.hide') })
    );

    const show = await screen.findByRole('button', { name: akMT('reportModule.savedReports.show') });

    expect(show).toHaveTextContent('2');
    expect(localStorage.getItem(SAVED_REPORTS_PANEL_KEY)).toBe('closed');

    await userEvent.click(show);

    expect(await panel()).toBeInTheDocument();
  });

  it('says when the limit is reached', async () => {
    server.use(
      http.get(buildAPITestURL(SavedReportEndpoints.list()), () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [buildSavedReportSummary(), buildSavedReportSummary()],
          max_saved_reports: 2,
        })
      )
    );

    await renderAtRoute(GENERATE);

    expect(
      await within(await panel()).findByText(akMT('reportModule.savedReports.limitReached', { max: 2 }))
    ).toBeInTheDocument();
  });
});
