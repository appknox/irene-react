import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { formatNotificationDate } from '@/features/notifications/utils';
import { buildNfNsapprvd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsapprvd1 } from './index';

const context = buildNfNsapprvd1Context();

describe('NfNsapprvd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsapprvd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsapprvd1', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatNotificationDate(context.namespace_created_on),
          moderator_username: context.moderator_username,
        })
      )
    );
  });
});
