import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { storeNameForUrl } from '@/features/notifications/utils';
import { buildNfStrUrlVldtnErrContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlVldtnErr } from './index';

const context = buildNfStrUrlVldtnErrContext();

describe('NfStrUrlVldtnErr', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlVldtnErr context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-vldtn-err', {
          store_name: storeNameForUrl(context.store_url),
        })
      )
    );

    expect(element('error')).toHaveTextContent(akMT('errorMessage'));
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlVldtnErr context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });

  it('states the error the server reported', () => {
    renderWithRouterContext(<NfStrUrlVldtnErr context={context} />);

    expect(element('error')).toHaveTextContent(context.error_message);
  });

  it('names the store the listing came from, rather than its URL', () => {
    renderWithRouterContext(<NfStrUrlVldtnErr context={context} />);

    expect(element('message-body')).toHaveTextContent(akMT('googlePlayStore'));
    expect(element('message-body')).not.toHaveTextContent(context.store_url);
  });
});
