import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailnprjdeny1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailnprjdeny1 } from './index';

const context = buildNfUpldfailnprjdeny1Context();

describe('NfUpldfailnprjdeny1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailnprjdeny1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailnprjdeny1', {
          platform_display: context.platform_display,
          package_name: context.package_name,
        })
      )
    );
  });
});
