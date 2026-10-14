import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfApistcmpltd1Context } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfApistcmpltd1 } from './index';

const context = buildNfApistcmpltd1Context();

describe('NfApistcmpltd1', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfApistcmpltd1 context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-apistcmpltd1', {
          platform_display: context.platform_display,
          file_name: context.file_name,
          package_name: context.package_name,
        })
      )
    );
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfApistcmpltd1 context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('counts every severity, in the order the breakdown lists them', () => {
    renderWithRouterContext(<NfApistcmpltd1 context={context} />);

    const severities = [
      [akMT('critical'), context.critical_count],
      [akMT('high'), context.high_count],
      [akMT('medium'), context.medium_count],
      [akMT('low'), context.low_count],
      [akMT('passed'), context.passed_count],
      [akMT('untested'), context.untested_count],
    ];

    const rows = within(element('risk-counts')).getAllByRole('listitem');

    expect(rows).toHaveLength(severities.length);

    severities.forEach(([label, count], index) => {
      expect(rows[index]).toHaveTextContent(String(label));
      expect(rows[index]).toHaveTextContent(String(count));
    });
  });

  it('states the app version and build number', () => {
    renderWithRouterContext(<NfApistcmpltd1 context={context} />);

    expect(element('version')).toHaveTextContent(
      `version: ${context.version} | version code: ${context.version_code}`
    );
  });
});
