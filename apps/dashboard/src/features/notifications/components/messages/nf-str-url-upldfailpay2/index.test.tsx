import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { storeNameForUrl } from '@/features/notifications/utils';
import { buildNfStrUrlUpldfailpay2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlUpldfailpay2 } from './index';

const context = buildNfStrUrlUpldfailpay2Context();

describe('NfStrUrlUpldfailpay2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlUpldfailpay2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-upldfailpay2', {
          package_name: context.package_name,
          requester_username: context.requester_username,
          store_name: storeNameForUrl(context.store_url),
        })
      )
    );
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlUpldfailpay2 context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });
});
