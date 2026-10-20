import { describe, expect, it } from 'vitest';

import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfStrUrlNsreqstd2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlNsreqstd2 } from './index';

const context = buildNfStrUrlNsreqstd2Context();

describe('NfStrUrlNsreqstd2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlNsreqstd2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-nsreqstd2', {
          current_requester_username: context.current_requester_username,
          initial_requester_username: context.initial_requester_username,
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatDateTime(context.namespace_created_on, DateTimeFormat.LL),
        })
      )
    );
  });
});
