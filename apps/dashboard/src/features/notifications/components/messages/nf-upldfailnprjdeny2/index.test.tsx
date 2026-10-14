import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailnprjdeny2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailnprjdeny2 } from './index';

const context = buildNfUpldfailnprjdeny2Context();

describe('NfUpldfailnprjdeny2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailnprjdeny2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailnprjdeny2.primary', {
          platform_display: context.platform_display,
          package_name: context.package_name,
          requester_username: context.requester_username,
          requester_role: context.requester_role,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.projectSettings'));
  });

  it('links to /dashboard/project/$projectId/settings', () => {
    renderWithRouterContext(<NfUpldfailnprjdeny2 context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/project/${context.project_id}/settings`);
  });
});
