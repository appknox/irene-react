import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfNsautoapprvd2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsautoapprvd2 } from './index';

const context = buildNfNsautoapprvd2Context();

describe('NfNsautoapprvd2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsautoapprvd2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsautoapprvd2', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          requester_username: context.requester_username,
        })
      )
    );
  });
});
