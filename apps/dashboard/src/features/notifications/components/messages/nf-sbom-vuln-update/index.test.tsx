import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfSbomVulnUpdateContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSbomVulnUpdate } from './index';

const context = buildNfSbomVulnUpdateContext();

describe('NfSbomVulnUpdate', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfSbomVulnUpdate context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sbom-vuln-update', {
          max_severity: context.max_severity,
        })
      )
    );

    expect(element('component-card')).toHaveTextContent(akMT('notificationModule.advisory'));
    expect(element('component-card')).toHaveTextContent(akMT('notificationModule.fixedInVersion'));
    expect(element('component-card')).toHaveTextContent(akMT('notificationModule.affects'));

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewDirectory'));
  });

  it('links to /dashboard/sbom/component-inventory', () => {
    renderWithRouterContext(<NfSbomVulnUpdate context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(
      `/dashboard/sbom/component-inventory?component_query=${encodeURIComponent(context.component_name)}`
    );
  });

  it('names the component the notification is about', () => {
    renderWithRouterContext(<NfSbomVulnUpdate context={context} />);

    expect(element('component-name')).toHaveTextContent(context.name);
  });

  it('falls back to the registry-qualified name when the notification carries no plain one', () => {
    const unnamed = buildNfSbomVulnUpdateContext({ name: '' });

    renderWithRouterContext(<NfSbomVulnUpdate context={unnamed} />);

    expect(element('component-name')).toHaveTextContent(unnamed.component_name.split('::')[1]);
  });

  it('lists every advisory the notification carries', () => {
    const ghsaIds = ['GHSA-aaaa-bbbb-cccc', 'GHSA-dddd-eeee-ffff'];
    const many = buildNfSbomVulnUpdateContext({ ghsa_ids: ghsaIds });

    renderWithRouterContext(<NfSbomVulnUpdate context={many} />);

    expect(screen.getByText(ghsaIds.join(', '))).toBeInTheDocument();
  });

  it('falls back to the GitHub advisory when the notification carries no URL', () => {
    const ghsaId = 'GHSA-aaaa-bbbb-cccc';
    const withoutUrls = buildNfSbomVulnUpdateContext({ advisory_urls: [], ghsa_ids: [ghsaId] });

    renderWithRouterContext(<NfSbomVulnUpdate context={withoutUrls} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`https://github.com/advisories/${ghsaId}`);
  });

  it('renders when the server sends neither advisory array', () => {
    const bare = buildNfSbomVulnUpdateContext({ advisory_urls: [], ghsa_ids: [] });

    renderWithRouterContext(<NfSbomVulnUpdate context={bare} />);

    expect(element('message-body')).toBeInTheDocument();
  });

  it('states the advisory, the fixed version and how many apps are affected', () => {
    renderWithRouterContext(<NfSbomVulnUpdate context={context} />);

    const card = element('component-card');

    expect(card).toHaveTextContent((context.ghsa_ids ?? []).join(', '));
    expect(card).toHaveTextContent(context.fixed_version);
    expect(card).toHaveTextContent(String(context.affected_apps_count));
  });
});
