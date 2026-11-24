import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe } from '@tests/factories';
import { renderWithProviders } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationNameHeader } from './organization-name-header';

/* The header reads the organization from the store the signed-in routes fill. */
const inOrganization = (name: string, standing: { is_owner: boolean; is_admin: boolean }) =>
  organizationStore
    .getState()
    .select(buildOrganization({ name }), buildOrganizationMe(standing));

const addButton = () => screen.getByRole('button', { name: new RegExp(akMT('addOrgName')) });

describe('OrganizationNameHeader', () => {
  beforeEach(() => {
    server.use(
      http.put('*/api/organizations/:organizationId', () =>
        HttpResponse.json(buildOrganization({ name: 'Acme' }))
      )
    );
  });

  it('shows the name once the organization has one', () => {
    inOrganization('Acme', { is_owner: false, is_admin: false });

    renderWithProviders(<OrganizationNameHeader />);

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText(akMT('organizationName'))).toBeInTheDocument();
  });

  it('offers an owner the way to name an organization that has none', () => {
    inOrganization('', { is_owner: true, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    expect(addButton()).toBeEnabled();
  });

  it('closes the control to anyone who may not name it', () => {
    inOrganization('', { is_owner: false, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    expect(addButton()).toBeDisabled();
  });

  it('offers an administrator the way through to the settings', () => {
    inOrganization('Acme', { is_owner: false, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    expect(
      screen.getByRole('link', { name: new RegExp(akMT('organizationSettings')) })
    ).toHaveAttribute('href', '/dashboard/organization/settings');
  });

  it('withholds it from everyone else', () => {
    inOrganization('Acme', { is_owner: false, is_admin: false });

    renderWithProviders(<OrganizationNameHeader />);

    expect(
      screen.queryByRole('link', { name: new RegExp(akMT('organizationSettings')) })
    ).not.toBeInTheDocument();
  });

  it('saves a name, then says it was saved', async () => {
    const user = userEvent.setup();

    inOrganization('', { is_owner: true, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    await user.click(addButton());

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox'), 'Acme');
    await user.click(within(dialog).getByRole('button', { name: akMT('save') }));

    expect(await screen.findByRole('button', { name: akMT('ok') })).toBeInTheDocument();
  });

  it('puts the new name where the rest of the app reads it', async () => {
    const user = userEvent.setup();

    inOrganization('', { is_owner: true, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    await user.click(addButton());

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox'), 'Acme');
    await user.click(within(dialog).getByRole('button', { name: akMT('save') }));

    await waitFor(() =>
      expect(organizationStore.getState().selected?.name).toBe('Acme')
    );
  });

  it('says what went wrong when the rename is refused', async () => {
    const user = userEvent.setup();

    inOrganization('', { is_owner: true, is_admin: true });

    server.use(
      http.put('*/api/organizations/:organizationId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderWithProviders(<OrganizationNameHeader />);

    await user.click(addButton());

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox'), 'Acme');
    await user.click(within(dialog).getByRole('button', { name: akMT('save') }));

    /* The panel stays on the form rather than moving on to the confirmation. */
    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: akMT('ok') })).not.toBeInTheDocument()
    );

    expect(within(dialog).getByRole('textbox')).toHaveValue('Acme');
  });

  it('leaves the name alone when the panel is dismissed', async () => {
    const user = userEvent.setup();

    inOrganization('', { is_owner: true, is_admin: true });

    renderWithProviders(<OrganizationNameHeader />);

    await user.click(addButton());

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(organizationStore.getState().selected?.name).toBe('');
  });
});
