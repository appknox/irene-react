import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfNsapprvd2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsapprvd2 } from './index';

const context = buildNfNsapprvd2Context();

describe('NfNsapprvd2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsapprvd2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsapprvd2', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          requester_username: context.requester_username,
          moderator_username: context.moderator_username,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewNamespaces'));
  });

  it('links to /dashboard/organization/namespaces', () => {
    renderWithRouterContext(<NfNsapprvd2 context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain('/dashboard/organization/namespaces');
  });
});
