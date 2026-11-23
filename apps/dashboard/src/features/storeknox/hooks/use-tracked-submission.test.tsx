import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SubmissionEndpoints, type ApiSubmission } from '@irene/api/services/submission';
import { ENUMS } from '@irene/enums';

import { buildSubmission } from '@tests/factories';
import { renderWithProviders } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

import { useTrackedSubmission } from './use-tracked-submission';

interface FollowerProps {
  first: number | null;
  second: number | null;
  onStatusChange: (submission: ApiSubmission) => void;
}

/** Follows one upload, then another on request, showing the status it holds. */
function Follower({ first, second, onStatusChange }: Readonly<FollowerProps>) {
  const [submissionId, setSubmissionId] = useState(first);
  const tracked = useTrackedSubmission(submissionId, onStatusChange);

  return (
    <>
      <button type="button" onClick={() => setSubmissionId(second)}>
        switch
      </button>

      <button type="button" onClick={tracked.refetch}>
        refetch
      </button>

      <output data-test-status>{tracked.submission?.status}</output>
    </>
  );
}

const shownStatus = () => document.querySelector('[data-test-status]');

/** Answers one submission's endpoint, with a way to change what it says next. */
function mockSubmission(submission: ApiSubmission) {
  let current = submission;

  server.use(
    http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
      HttpResponse.json(current)
    )
  );

  return (next: ApiSubmission) => {
    current = next;
  };
}

describe('useTrackedSubmission', () => {
  it('does not call a switch to another upload a status change', async () => {
    const onStatusChange = vi.fn();
    const first = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING });
    const second = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.ANALYZING });

    mockSubmission(first);
    mockSubmission(second);

    renderWithProviders(
      <Follower first={first.id} second={second.id} onStatusChange={onStatusChange} />
    );

    await waitFor(() => expect(shownStatus()).toHaveTextContent(String(first.status)));

    await userEvent.click(screen.getByRole('button', { name: 'switch' }));

    await waitFor(() => expect(shownStatus()).toHaveTextContent(String(second.status)));
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('reports a move of the followed upload’s status', async () => {
    const onStatusChange = vi.fn();
    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING });
    const moved = { ...submission, status: ENUMS.SUBMISSION_STATUS.ANALYZING };
    const answer = mockSubmission(submission);

    renderWithProviders(
      <Follower first={submission.id} second={null} onStatusChange={onStatusChange} />
    );

    await waitFor(() => expect(shownStatus()).toHaveTextContent(String(submission.status)));

    answer(moved);
    await userEvent.click(screen.getByRole('button', { name: 'refetch' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledTimes(1));
    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining(moved));
  });

  it('reads nothing when asked to refetch with no upload to follow', async () => {
    const requested: string[] = [];

    const record = ({ request }: { request: Request }) => {
      requested.push(new URL(request.url).pathname);
    };

    server.events.on('request:start', record);

    try {
      renderWithProviders(<Follower first={null} second={null} onStatusChange={vi.fn()} />);

      await userEvent.click(screen.getByRole('button', { name: 'refetch' }));
    } finally {
      server.events.removeListener('request:start', record);
    }

    expect(requested).not.toContain(`/${SubmissionEndpoints.detail('')}`);
  });
});
