import { describe, expect, it } from 'vitest';

import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfNsrejctd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsrejctd1 } from './index';

const context = buildNfNsrejctd1Context();

describe('NfNsrejctd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsrejctd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsrejctd1', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatDateTime(context.namespace_created_on, DateTimeFormat.LL),
        })
      )
    );
  });
});
