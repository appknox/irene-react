import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailnsunaprv1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailnsunaprv1 } from './index';

const context = buildNfUpldfailnsunaprv1Context();

describe('NfUpldfailnsunaprv1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailnsunaprv1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailnsunaprv1', {
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        })
      )
    );
  });
});
