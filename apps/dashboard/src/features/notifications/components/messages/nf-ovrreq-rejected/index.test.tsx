import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfOvrreqRejectedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfOvrreqRejected } from './index';

const context = buildNfOvrreqRejectedContext();

describe('NfOvrreqRejected', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfOvrreqRejected context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-ovrreq-rejected', {
          reviewer_email: context.reviewer_email,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewTheVulnerability'));
  });

  it('links to /dashboard/file/$fileId/analysis/$analysisId', () => {
    renderWithRouterContext(<NfOvrreqRejected context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/analysis/${context.analysis_id}`);
  });

  it("states the reviewer's reasoning", () => {
    renderWithRouterContext(<NfOvrreqRejected context={context} />);

    expect(screen.getByText(context.rejection_reason)).toBeInTheDocument();
  });
});
