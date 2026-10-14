import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfPublicApiUserUpdatedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfPublicApiUserUpdated } from './index';

const context = buildNfPublicApiUserUpdatedContext();

describe('NfPublicApiUserUpdated', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfPublicApiUserUpdated context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-public-api-user-updated', {
          type: context.type,
          user_email: context.user_email,
          current: context.current,
          updated: context.updated,
          changed_by: context.changed_by,
        })
      )
    );
  });
});
