import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { storeNameForUrl } from '@/features/notifications/utils';
import { buildNfStrUrlUpldfailnsunaprv1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlUpldfailnsunaprv1 } from './index';

const context = buildNfStrUrlUpldfailnsunaprv1Context();

describe('NfStrUrlUpldfailnsunaprv1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnsunaprv1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-upldfailnsunaprv1', {
          store_name: storeNameForUrl(context.store_url),
        })
      )
    );
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnsunaprv1 context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });

  it('names the store the listing came from, rather than its URL', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnsunaprv1 context={context} />);

    expect(element('message-body')).toHaveTextContent(akMT('googlePlayStore'));
    expect(element('message-body')).not.toHaveTextContent(context.store_url);
  });
});
