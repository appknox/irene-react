import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfSkNewversnContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSkNewversn } from './index';

const context = buildNfSkNewversnContext();

describe('NfSkNewversn', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfSkNewversn context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sk-newversn', {
          platform_display: context.platform_display,
          app_name: context.app_name,
          package_name: context.package_name,
          version_unscanned: context.version_unscanned,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewMonitoringResults'));
  });

  it('links to /dashboard/storeknox/inventory-details/$id/unscanned-version', () => {
    renderWithRouterContext(<NfSkNewversn context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(
      `/dashboard/storeknox/inventory-details/${context.sk_app_id}/unscanned-version`
    );
  });
});
