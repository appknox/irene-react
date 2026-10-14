import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { storeNameForUrl } from '@/features/notifications/utils';
import { buildNfStrUrlUploadSuccessContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlUploadSuccess } from './index';

const context = buildNfStrUrlUploadSuccessContext();

describe('NfStrUrlUploadSuccess', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlUploadSuccess context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-upload-success.prefix', {
          platform_display: context.platform_display,
          package_name: context.package_name,
          store_name: storeNameForUrl(context.store_url),
        })
      )
    );

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-str-url-upload-success.suffix')
    );
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfStrUrlUploadSuccess context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('states the app version and build number', () => {
    renderWithRouterContext(<NfStrUrlUploadSuccess context={context} />);

    expect(element('version')).toHaveTextContent(
      `version: ${context.version} | version code: ${context.version_code}`
    );
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlUploadSuccess context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });
});
