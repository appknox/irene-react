import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailpay2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailpay2 } from './index';

const context = buildNfUpldfailpay2Context();

describe('NfUpldfailpay2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailpay2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailpay2', {
          package_name: context.package_name,
          requester_username: context.requester_username,
        })
      )
    );
  });
});
