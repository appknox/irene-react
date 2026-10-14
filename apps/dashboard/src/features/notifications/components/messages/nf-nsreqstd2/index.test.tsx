import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { formatNotificationDate } from '@/features/notifications/utils';
import { buildNfNsreqstd2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsreqstd2 } from './index';

const context = buildNfNsreqstd2Context();

describe('NfNsreqstd2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsreqstd2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsreqstd2', {
          current_requester_username: context.current_requester_username,
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          initial_requester_username: context.initial_requester_username,
          namespace_created_on: formatNotificationDate(context.namespace_created_on),
        })
      )
    );
  });
});
