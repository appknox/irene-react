import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ReportRequestEndpoints } from '@irene/api/services/report-request/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import { buildOrganizationMe, buildReportPreview, buildReportRequest, buildSession } from '@tests/factories';
import { lunaRefusal, mockReporting, mockReportRequest } from '@tests/reports';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';

const GENERATE = '/dashboard/reports/generate';

const promptBox = () => screen.findByRole('textbox', { name: akMT('reportModule.whatDoYouWantToLearn') });

/** Answers the report request with these statuses, one per read, the last one repeating. */
const mockRequestStatuses = (...statuses: number[]) => {
  const request = buildReportRequest();
  let reads = 0;

  server.use(
    http.post(buildAPITestURL(ReportRequestEndpoints.list()), () =>
      HttpResponse.json({ ...request, status: ENUMS.AI_REPORTING_REQUEST_STATUS.PENDING })
    ),
    http.get(buildAPITestURL(ReportRequestEndpoints.detail(request.id)), () => {
      const status = statuses[Math.min(reads, statuses.length - 1)];
      reads += 1;

      return HttpResponse.json({ ...request, status });
    })
  );

  return request;
};

describe('GeneratePage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockReporting();
  });

  it('asks for the question with the example prompts', async () => {
    await renderAtRoute(GENERATE);

    expect(await promptBox()).toBeInTheDocument();
    expect(screen.getByText(akMT('reportModule.examples.vapt.prompt1'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('reportModule.generateReport') })).toBeDisabled();
  });

  it('switches the examples by category', async () => {
    await renderAtRoute(GENERATE);
    await promptBox();

    await userEvent.click(screen.getByRole('combobox', { name: akMT('reportModule.category') }));
    await userEvent.click(await screen.findByRole('option', { name: akMT('reportModule.examples.sbom.label') }));

    expect(await screen.findByText(akMT('reportModule.examples.sbom.prompt1'))).toBeInTheDocument();
  });

  it('pastes an example into the question box', async () => {
    await renderAtRoute(GENERATE);

    await userEvent.click(await screen.findByText(akMT('reportModule.examples.vapt.prompt2')));

    expect(await promptBox()).toHaveValue(akMT('reportModule.examples.vapt.prompt2'));
  });

  it('refuses a question over 400 characters', async () => {
    await renderAtRoute(GENERATE);

    const box = await promptBox();

    await userEvent.click(box);
    await userEvent.paste('x'.repeat(401));

    expect(screen.getByRole('button', { name: akMT('reportModule.generateReport') })).toBeDisabled();
    expect(screen.getByText(akMT('reportModule.generate.characterCount', { count: 401, max: 400 }))).toBeInTheDocument();
  });

  it('generates the report, waits for Luna and opens it', async () => {
    const request = mockRequestStatuses(
      ENUMS.AI_REPORTING_REQUEST_STATUS.PROCESSING,
      ENUMS.AI_REPORTING_REQUEST_STATUS.COMPLETED
    );

    const preview = buildReportPreview();

    mockReportRequest({ ...request, status: ENUMS.AI_REPORTING_REQUEST_STATUS.COMPLETED }, preview);

    await renderAtRoute(GENERATE);
    await userEvent.type(await promptBox(), 'List my apps');
    await userEvent.click(screen.getByRole('button', { name: akMT('reportModule.generateReport') }));

    expect(await screen.findByRole('button', { name: akMT('reportModule.generating') })).toBeDisabled();
    expect(await screen.findByRole('heading', { name: preview.title }, { timeout: 8000 })).toBeInTheDocument();
  }, 10000);

  it('generates an example straight away', async () => {
    let body: unknown;

    server.use(
      http.post(buildAPITestURL(ReportRequestEndpoints.list()), async ({ request }) => {
        body = await request.json();

        return lunaRefusal('You have used this month’s AI reports.', 429);
      })
    );

    await renderAtRoute(GENERATE);

    await userEvent.click(
      await screen.findByRole('button', {
        name: akMT('reportModule.generate.generateFor', { prompt: akMT('reportModule.examples.vapt.prompt1') }),
      })
    );

    await waitFor(() => expect(body).toEqual({ query: akMT('reportModule.examples.vapt.prompt1') }));
  });

  it('says why Luna refused the question', async () => {
    const message = 'Query is required for creating a report request.';

    server.use(http.post(buildAPITestURL(ReportRequestEndpoints.list()), () => lunaRefusal(message, 500)));

    await renderAtRoute(GENERATE);
    await userEvent.type(await promptBox(), 'List my apps');
    await userEvent.click(screen.getByRole('button', { name: akMT('reportModule.generateReport') }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('reportModule.generateReport') })).toBeEnabled();
  });

  it('says how to switch AI reporting on while the organization has it off', async () => {
    mockReporting({ reportingSetting: false });

    await renderAtRoute(GENERATE);

    expect(await screen.findByText(akMT('reportModule.turnOnSettingsHeaderText'))).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: akMT('reportModule.turnOnSettingsButtonLabel') })).not.toBeInTheDocument();
  });

  it('offers an owner the way to switch it on', async () => {
    mockReporting({ reportingSetting: false });

    server.use(
      http.get(`*/${OrganizationEndpoints.me('ORG').replace('ORG', ':id')}`, () => HttpResponse.json(buildOrganizationMe({ is_owner: true })))
    );

    await renderAtRoute(GENERATE);

    expect(await screen.findByRole('link', { name: akMT('reportModule.turnOnSettingsButtonLabel') })).toHaveAttribute(
      'href',
      '/dashboard/organization/settings/ai-powered-features'
    );
  });
});
