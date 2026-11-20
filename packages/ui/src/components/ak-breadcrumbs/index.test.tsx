import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';

function Trail() {
  return (
    <AkBreadcrumbs aria-label="Breadcrumb">
      <AkBreadcrumbsItem asChild>
        <a href="/inventory">App inventory</a>
      </AkBreadcrumbsItem>

      <AkBreadcrumbsItem current>Archived apps</AkBreadcrumbsItem>
    </AkBreadcrumbs>
  );
}

describe('AkBreadcrumbs', () => {
  it('lists each step in order within a named navigation', () => {
    render(<Trail />);

    const items = screen.getAllByRole('listitem');

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(items[0]).toHaveTextContent('App inventory');
    expect(items[1]).toHaveTextContent('Archived apps');
  });

  it('renders an earlier step as the link it is given', () => {
    render(<Trail />);

    expect(screen.getByRole('link', { name: 'App inventory' })).toHaveAttribute(
      'href',
      '/inventory'
    );
  });

  it('marks the last step as the current page and leaves it unlinked', () => {
    render(<Trail />);

    expect(screen.getByText('Archived apps')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Archived apps' })).not.toBeInTheDocument();
  });

  it('draws a separator between steps but not after the last', () => {
    render(<Trail />);

    const [first, last] = screen.getAllByRole('listitem');

    expect(first).toHaveTextContent('/');
    expect(last).not.toHaveTextContent('/');
  });
});
