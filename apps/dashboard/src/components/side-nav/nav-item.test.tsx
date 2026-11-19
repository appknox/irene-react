import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SideNavItem, type SideNavItemDefinition } from '@/components/side-nav/nav-item';
import { renderWithRouterContext } from '@tests/render';

/** An item leading somewhere other than the page the router context opens at, which is `/`. */
const buildItem = (overrides: Partial<SideNavItemDefinition> = {}): SideNavItemDefinition => ({
  id: faker.string.uuid(),
  label: faker.lorem.words(2),
  icon: 'material-symbols:inventory-2',
  to: '/dashboard/projects',
  ...overrides,
});

describe('SideNavItem', () => {
  it('marks itself on a page it covers through activeWhen', () => {
    const item = buildItem({ activeWhen: ['/'] });

    renderWithRouterContext(<SideNavItem item={item} isCollapsed={false} />);

    const link = screen.getByRole('link', { name: item.label });

    expect(link).toHaveAttribute('data-status', 'active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('stays unmarked on a page that is neither its own nor one it covers', () => {
    const item = buildItem({ activeWhen: ['/dashboard/notifications'] });

    renderWithRouterContext(<SideNavItem item={item} isCollapsed={false} />);

    expect(screen.getByRole('link', { name: item.label })).not.toHaveAttribute('data-status');
  });
});
