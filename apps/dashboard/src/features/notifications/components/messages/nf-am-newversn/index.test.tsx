import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfAmNewversnContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfAmNewversn } from './index';

const context = buildNfAmNewversnContext();

describe('NfAmNewversn', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfAmNewversn context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-am-newversn', {
          platform_display: context.platform_display,
          app_name: context.app_name,
          package_name: context.package_name,
          version_unscanned: context.version_unscanned,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewStoreMonitoringResults'));
  });

  it('links to /dashboard/store-monitoring/$amAppId', () => {
    renderWithRouterContext(<NfAmNewversn context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/store-monitoring/${context.am_app_id}`);
  });
});
