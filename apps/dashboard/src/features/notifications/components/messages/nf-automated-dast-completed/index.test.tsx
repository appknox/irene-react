import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfAutomatedDastCompletedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfAutomatedDastCompleted } from './index';

const context = buildNfAutomatedDastCompletedContext();

describe('NfAutomatedDastCompleted', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfAutomatedDastCompleted context={context} />);

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-automated-dast-completed.prefix')
    );

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-automated-dast-completed.suffix', {
          platform_display: context.platform,
          package_name: context.package_name,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewResults'));
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfAutomatedDastCompleted context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('links to /dashboard/file/$fileId/dynamic-scan/results', () => {
    renderWithRouterContext(<NfAutomatedDastCompleted context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/dynamic-scan/results`);
  });
});
