import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { API_RECORD_TYPE_FIELD } from '@irene/api/normalization';
import { SubmissionEndpoints, SubmissionService } from '@irene/api/services/submission';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildSubmission } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage } from '@tests/utils';

const LIST_URL = buildAPITestURL(SubmissionEndpoints.list());

/** Captures the query string msw received, so assertions can read the params. */
function interceptList(respond: () => Response) {
  const seen: { params: URLSearchParams } = { params: new URLSearchParams() };

  server.use(
    http.get(LIST_URL, ({ request }) => {
      seen.params = new URL(request.url).searchParams;

      return respond();
    })
  );

  return seen;
}

describe('SubmissionService.getSubmissions', () => {
  it('returns the submissions as items with a count', async () => {
    const submissions = [buildSubmission(), buildSubmission()];

    interceptList(() => HttpResponse.json(buildDrfPage(submissions, { count: 12 })));

    const page = await SubmissionService.getSubmissions({ limit: 10, offset: 0 });

    expect(page.items).toMatchObject(submissions);
    expect(page.count).toBe(12);
  });

  it('tags every row, so the server can update it where it is cached', async () => {
    interceptList(() => HttpResponse.json(buildDrfPage([buildSubmission(), buildSubmission()])));

    const page = await SubmissionService.getSubmissions({ limit: 10, offset: 0 });

    expect(page.items.map((submission) => submission[API_RECORD_TYPE_FIELD])).toEqual([
      'submission',
      'submission',
    ]);
  });

  it('sends limit and offset as query params', async () => {
    const seen = interceptList(() => HttpResponse.json(buildDrfPage([])));

    await SubmissionService.getSubmissions({ limit: 10, offset: 20 });

    expect(seen.params.get('limit')).toBe('10');
    expect(seen.params.get('offset')).toBe('20');
  });

  it('sends a status only when one is asked for', async () => {
    const withoutStatus = interceptList(() => HttpResponse.json(buildDrfPage([])));
    await SubmissionService.getSubmissions({ limit: 10, offset: 0 });
    expect(withoutStatus.params.has('status')).toBe(false);

    const withStatus = interceptList(() => HttpResponse.json(buildDrfPage([])));
    await SubmissionService.getSubmissions({ limit: 10, offset: 0, status: 4 });
    expect(withStatus.params.get('status')).toBe('4');
  });

  it('returns an empty page when the account has uploaded nothing', async () => {
    interceptList(() => HttpResponse.json(buildDrfPage([])));

    const page = await SubmissionService.getSubmissions({ limit: 10, offset: 0 });

    expect(page.items).toEqual([]);
    expect(page.count).toBe(0);
  });

  it('rejects rather than returning an empty page', async () => {
    interceptList(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }));

    await expect(SubmissionService.getSubmissions({ limit: 10, offset: 0 })).rejects.toThrow('500');
  });

  it('rejects with a 403 for an account that may not read them', async () => {
    interceptList(() =>
      HttpResponse.json({ detail: 'Forbidden' }, { status: HTTP_STATUS_CODES.FORBIDDEN })
    );

    const error = await SubmissionService.getSubmissions({ limit: 10, offset: 0 }).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });
});
