import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { buildNfSbomCompUpdateContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSbomCompUpdate } from './index';

const context = buildNfSbomCompUpdateContext();

describe('NfSbomCompUpdate', () => {
  it('renders the text of every message it shows', () => {
    renderWithRouterContext(<NfSbomCompUpdate context={context} />);

    expect(element('message-body')).toHaveTextContent(
      akMT('notificationModule.messages.nf-sbom-comp-update')
    );

    expect(element('component-card')).toHaveTextContent(akMT('notificationModule.newVersion'));

    expect(element('component-card')).toHaveTextContent(akMT('notificationModule.affects'));

    expect(document.body).toHaveTextContent(akMT('notificationModule.viewDirectory'));
  });

  it('links to /dashboard/sbom/component-inventory', () => {
    renderWithRouterContext(<NfSbomCompUpdate context={context} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain(
      `/dashboard/sbom/component-inventory?component_query=${encodeURIComponent(context.component_name)}`
    );
  });

  it('names the component the notification is about', () => {
    renderWithRouterContext(<NfSbomCompUpdate context={context} />);

    expect(element('component-name')).toHaveTextContent(context.name);
  });

  it('falls back to the registry-qualified name when the notification carries no plain one', () => {
    const unnamed = buildNfSbomCompUpdateContext({ name: '' });

    renderWithRouterContext(<NfSbomCompUpdate context={unnamed} />);

    expect(element('component-name')).toHaveTextContent(unnamed.component_name.split('::')[1]);
  });

  it('leaves out the registry link when the notification carries no registry URL', () => {
    const withoutRegistry = buildNfSbomCompUpdateContext({ registry_url: '' });

    renderWithRouterContext(<NfSbomCompUpdate context={withoutRegistry} />);

    const hrefs = screen.getAllByRole('link').map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).not.toContain(context.registry_url);
  });

  it('states the version the component moved to', () => {
    renderWithRouterContext(<NfSbomCompUpdate context={context} />);

    expect(screen.getByText(context.new_version)).toBeInTheDocument();
  });

  it('states the new version and how many apps are affected', () => {
    renderWithRouterContext(<NfSbomCompUpdate context={context} />);

    const card = element('component-card');

    expect(card).toHaveTextContent(context.new_version);
    expect(card).toHaveTextContent(String(context.affected_apps_count));
  });
});
