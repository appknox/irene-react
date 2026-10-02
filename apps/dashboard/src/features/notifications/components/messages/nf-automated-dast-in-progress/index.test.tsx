import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfAutomatedDastInProgressContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfAutomatedDastInProgress } from './index';

const context = buildNfAutomatedDastInProgressContext();

describe('NfAutomatedDastInProgress', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfAutomatedDastInProgress context={context} />);

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-automated-dast-in-progress.prefix')
    );

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-automated-dast-in-progress.suffix', {
          platform_display: context.platform,
          package_name: context.package_name,
        })
      )
    );
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfAutomatedDastInProgress context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });
});
