import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfOvrreqApprovedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfOvrreqApproved } from './index';

const context = buildNfOvrreqApprovedContext();

describe('NfOvrreqApproved', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfOvrreqApproved context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-ovrreq-approved', {
          reviewer_email: context.reviewer_email,
          requester_email: context.requester_email,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewVulnerabilityDetails'));
  });

  it('links to /dashboard/file/$fileId/analysis/$analysisId', () => {
    renderWithRouterContext(<NfOvrreqApproved context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/analysis/${context.analysis_id}`);
  });
});
