import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfStrUrlUpldfailnprjdeny2Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfStrUrlUpldfailnprjdeny2 } from './index';

const context = buildNfStrUrlUpldfailnprjdeny2Context();

describe('NfStrUrlUpldfailnprjdeny2', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny2 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-str-url-upldfailnprjdeny2.primary', {
          platform_display: context.platform_display,
          package_name: context.package_name,
          requester_username: context.requester_username,
          requester_role: context.requester_role,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.projectSettings'));
  });

  it('links to /dashboard/project/$projectId/settings', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny2 context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/project/${context.project_id}/settings`);
  });

  it('links to the app on its store', () => {
    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny2 context={context} />);

    expect(element('store-link')).toHaveAttribute('href', context.store_url);
  });

  it('leaves out the store link when the upload came from no store', () => {
    const withoutStore = buildNfStrUrlUpldfailnprjdeny2Context({ store_url: '' });

    renderWithRouterContext(<NfStrUrlUpldfailnprjdeny2 context={withoutStore} />);

    expect(document.querySelector('[data-test-notification-store-link]')).toBeNull();
  });
});
