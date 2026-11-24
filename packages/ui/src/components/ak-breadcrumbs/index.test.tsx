import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkBreadcrumbs } from '@irene/ui/ak-breadcrumbs';

const TRAIL = [
  { title: 'Organization', link: <a href="/organization">Organization</a> },
  { title: 'Settings' },
];

describe('AkBreadcrumbs', () => {
  it('names itself as the trail, for a screen reader to skip to', () => {
    render(<AkBreadcrumbs items={TRAIL} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('links every step above the one being read', () => {
    render(<AkBreadcrumbs items={TRAIL} />);

    expect(screen.getByRole('link', { name: 'Organization' })).toHaveAttribute(
      'href',
      '/organization'
    );
  });

  /* The last step is where the reader already is, so it is said rather than offered. */
  it('marks the last step as the page being read and leaves it unlinked', () => {
    render(<AkBreadcrumbs items={TRAIL} />);

    const current = screen.getByText('Settings');

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('says a step without a link rather than offering one', () => {
    render(<AkBreadcrumbs items={[{ title: 'Organization' }, { title: 'Settings' }]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
  });

  it('separates the steps, hiding the separator from a screen reader', () => {
    const { container } = render(<AkBreadcrumbs items={TRAIL} />);

    const separators = container.querySelectorAll('[data-test-breadcrumb-separator]');

    expect(separators).toHaveLength(1);
    expect(separators[0]).toHaveTextContent('/');
    expect(separators[0]).toHaveAttribute('aria-hidden');
  });

  it('separates them with what it is given', () => {
    const { container } = render(<AkBreadcrumbs items={TRAIL} separator="›" />);

    expect(container.querySelector('[data-test-breadcrumb-separator]')).toHaveTextContent('›');
  });
});
