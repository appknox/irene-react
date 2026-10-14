import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { storeNameForUrl } from '@/features/notifications/utils';
import { buildNfStrUrlUpldfailnprjdeny1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlUpldfailnprjdeny1 } from './index';

const context = buildNfStrUrlUpldfailnprjdeny1Context();

describe('NfStrUrlUpldfailnprjdeny1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-upldfailnprjdeny1', {
          package_name: context.package_name,
          store_name: storeNameForUrl(context.store_url),
        })
      )
    );
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny1 context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });
});
