import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe } from '@tests/factories';
import { renderWithProviders } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationNameModal } from './organization-name-modal';

describe('OrganizationNameModal', () => {
  beforeEach(() => {
    organizationStore
      .getState()
      .select(
        buildOrganization({ name: 'Acme' }),
        buildOrganizationMe({ is_owner: true, is_admin: true })
      );

    server.use(
      http.put('*/api/organizations/:organizationId', () =>
        HttpResponse.json(buildOrganization({ name: 'Acme Rebranded' }))
      )
    );
  });

  it('opens on the name the organization already has', () => {
    renderWithProviders(
      <OrganizationNameModal isOpen currentName="Acme" onClose={vi.fn()} />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Acme');
  });

  it('says the name was updated rather than added when there already was one', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <OrganizationNameModal isOpen currentName="Acme" onClose={vi.fn()} />
    );

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Acme Rebranded');
    await user.click(screen.getByRole('button', { name: akMT('save') }));

    expect(await screen.findByRole('button', { name: akMT('ok') })).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it('draws nothing while it is closed', () => {
    renderWithProviders(
      <OrganizationNameModal isOpen={false} currentName="Acme" onClose={vi.fn()} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
