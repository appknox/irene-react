import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { buildNfSbomcmpltdContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSbomcmpltd } from './index';

const context = buildNfSbomcmpltdContext();

describe('NfSbomcmpltd', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfSbomcmpltd context={context} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(akMT('notificationModule.messages.nf-sbomcmpltd.prefix'))
    );

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sbomcmpltd.suffix', {
          platform_display: context.platform_display,
          file_name: context.file_name,
          package_name: context.package_name,
        })
      )
    );

    expect(element('sbom-summary')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sbomcmpltd.summary', {
          total_components: context.components_count,
          vulnerable_components: context.vulnerable_components_count,
          outdated_components: context.components_with_updates_count,
        })
      )
    );

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewSBOMResults'));
  });

  it('links to /dashboard/file/$fileId', () => {
    renderWithRouterContext(<NfSbomcmpltd context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(`/dashboard/file/${context.file_id}`);
  });

  it('links to /dashboard/sbom/apps/$sbomProjectId/scans/$sbomFileId', () => {
    renderWithRouterContext(<NfSbomcmpltd context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(
      `/dashboard/sbom/apps/${context.sb_project_id}/scans/${context.sb_file_id}`
    );
  });

  it('states the app version and build number', () => {
    renderWithRouterContext(<NfSbomcmpltd context={context} />);

    expect(element('version')).toHaveTextContent(
      `version: ${context.version} | version code: ${context.version_code}`
    );
  });
});
