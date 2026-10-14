import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfSystmFileUploadSuccessContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSystmFileUploadSuccess } from './index';

const context = buildNfSystmFileUploadSuccessContext();

describe('NfSystmFileUploadSuccess', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfSystmFileUploadSuccess context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-systm-file-upload-success.prefix', {
          platform_display: context.platform_display,
          package_name: context.package_name,
        })
      )
    );

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-systm-file-upload-success.suffix')
    );
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfSystmFileUploadSuccess context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('states the app version and build number', () => {
    renderWithRouterContext(<NfSystmFileUploadSuccess context={context} />);

    expect(element('version')).toHaveTextContent(
      `version: ${context.version} | version code: ${context.version_code}`
    );
  });
});
