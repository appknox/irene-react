import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfJiraPushErrContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfJiraPushErr } from './index';

const context = buildNfJiraPushErrContext();

describe('NfJiraPushErr', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfJiraPushErr context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-jira-push-err', {
          file_id: context.file_id,
          package_name: context.package_name,
        })
      )
    );

    expect(element('error')).toHaveTextContent(akMT('errorMessage'));
  });

  it('states the error the server reported', () => {
    renderWithRouterContext(<NfJiraPushErr context={context} />);

    expect(element('error')).toHaveTextContent(context.error_message);
  });
});
