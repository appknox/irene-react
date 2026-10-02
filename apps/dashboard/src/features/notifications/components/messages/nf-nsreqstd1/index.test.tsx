import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfNsreqstd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsreqstd1 } from './index';

const context = buildNfNsreqstd1Context();

describe('NfNsreqstd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsreqstd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsreqstd1', {
          requester_username: context.requester_username,
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        })
      )
    );
  });
});
