import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfOvrreqApprovedReqstrContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfOvrreqApprovedReqstr } from './index';

const context = buildNfOvrreqApprovedReqstrContext();

describe('NfOvrreqApprovedReqstr', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfOvrreqApprovedReqstr context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-ovrreq-approved-reqstr', {
          reviewer_email: context.reviewer_email,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewVulnerabilityDetails'));
  });

  it('links to /dashboard/file/$fileId/analysis/$analysisId', () => {
    renderWithRouterContext(<NfOvrreqApprovedReqstr context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/analysis/${context.analysis_id}`);
  });
});
