import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfNsautoapprvd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfNsautoapprvd1 } from './index';

const context = buildNfNsautoapprvd1Context();

describe('NfNsautoapprvd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfNsautoapprvd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-nsautoapprvd1', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        })
      )
    );
  });
});
