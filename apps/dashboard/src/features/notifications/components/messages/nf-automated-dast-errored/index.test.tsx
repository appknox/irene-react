import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfAutomatedDastErroredContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfAutomatedDastErrored } from './index';

const context = buildNfAutomatedDastErroredContext();

describe('NfAutomatedDastErrored', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfAutomatedDastErrored context={context} />);

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-automated-dast-errored.prefix')
    );

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-automated-dast-errored.suffix', {
          platform_display: context.platform,
          package_name: context.package_name,
          error_message: context.error_message,
        })
      )
    );

    expect(element('message-body')).toHaveTextContent(akMT('here'));
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfAutomatedDastErrored context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('links to /dashboard/file/$fileId/dynamic-scan/manual', () => {
    renderWithRouterContext(<NfAutomatedDastErrored context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/dynamic-scan/manual`);
  });
});
