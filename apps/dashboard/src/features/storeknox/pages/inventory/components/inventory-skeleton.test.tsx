import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe } from '@tests/factories';
import { renderWithProviders } from '@tests/render';

import { InventorySkeleton } from './inventory-skeleton';

const renderSkeleton = () => {
  const { container } = renderWithProviders(<InventorySkeleton />);

  return container.querySelectorAll('[data-slot="skeleton"]').length;
};

describe('the inventory’s placeholder', () => {
  it('tells a screen reader the inventory is loading', () => {
    renderWithProviders(<InventorySkeleton />);

    expect(screen.getByText(akMT('loading')).closest('[aria-busy]')).toHaveAttribute(
      'data-test-sk-inventory-skeleton'
    );
  });

  it('holds a place for the settings button only for an owner', () => {
    organizationStore
      .getState()
      .select(buildOrganization(), buildOrganizationMe({ is_owner: false }));

    const forMember = renderSkeleton();

    organizationStore
      .getState()
      .select(buildOrganization(), buildOrganizationMe({ is_owner: true }));

    expect(renderSkeleton()).toBe(forMember + 1);
  });
});
