import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfUpldfailpayrq1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfUpldfailpayrq1 } from './index';

const context = buildNfUpldfailpayrq1Context();

describe('NfUpldfailpayrq1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfUpldfailpayrq1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-upldfailpayrq1', {
          package_name: context.package_name,
        })
      )
    );
  });
});
