import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfAutomatedDastPartiallyCompletedContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfAutomatedDastPartiallyCompleted } from './index';

const context = buildNfAutomatedDastPartiallyCompletedContext();

describe('NfAutomatedDastPartiallyCompleted', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfAutomatedDastPartiallyCompleted context={context} />);

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-automated-dast-partially-completed.prefix')
    );

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-automated-dast-partially-completed.suffix', {
          platform_display: context.platform,
          package_name: context.package_name,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('viewResults'));
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfAutomatedDastPartiallyCompleted context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('links to /dashboard/file/$fileId/dynamic-scan/results', () => {
    renderWithRouterContext(<NfAutomatedDastPartiallyCompleted context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}/dynamic-scan/results`);
  });
});
