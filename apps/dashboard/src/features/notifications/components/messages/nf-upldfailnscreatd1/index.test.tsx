import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailnscreatd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailnscreatd1 } from './index';

const context = buildNfUpldfailnscreatd1Context();

describe('NfUpldfailnscreatd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailnscreatd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailnscreatd1', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        })
      )
    );
  });
});
