import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfOvrreqRaisedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfOvrreqRaised } from './index';

const context = buildNfOvrreqRaisedContext();

describe('NfOvrreqRaised', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfOvrreqRaised context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-ovrreq-raised', {
          requester_email: context.requester_email,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewRequest'));
  });

  it('links to /dashboard/file/$fileId/analysis/$analysisId', () => {
    renderWithRouterContext(<NfOvrreqRaised context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/analysis/${context.analysis_id}`);
  });
});
