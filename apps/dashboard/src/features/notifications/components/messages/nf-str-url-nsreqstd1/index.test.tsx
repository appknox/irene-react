import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfStrUrlNsreqstd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlNsreqstd1 } from './index';

const context = buildNfStrUrlNsreqstd1Context();

describe('NfStrUrlNsreqstd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlNsreqstd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-nsreqstd1', {
          requester_username: context.requester_username,
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        })
      )
    );
  });
});
