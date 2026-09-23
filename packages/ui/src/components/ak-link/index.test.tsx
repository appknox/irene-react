import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkLink } from '@irene/ui/ak-link';

describe('AkLink', () => {
  it('renders an anchor with its href', () => {
    render(<AkLink href="https://appknox.com">Appknox</AkLink>);

    expect(screen.getByRole('link', { name: 'Appknox' })).toHaveAttribute(
      'href',
      'https://appknox.com'
    );
  });

  it('renders the primary colour and an underline by default', () => {
    render(<AkLink href="#">Support</AkLink>);

    const link = screen.getByRole('link', { name: 'Support' });

    expect(link).toHaveClass('text-primary');
    expect(link).toHaveClass('underline');
  });

  it('renders the colour and underline variants it is given', () => {
    render(
      <AkLink href="#" color="textSecondary" underline="hover">
        Support
      </AkLink>
    );

    const link = screen.getByRole('link', { name: 'Support' });

    expect(link).toHaveClass('text-foreground-muted');
    expect(link).toHaveClass('hover:underline');
  });

  it('renders onto its child when asChild is set', () => {
    render(
      <AkLink asChild>
        <button type="button">Sign out</button>
      </AkLink>
    );

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveClass('text-primary');
  });
});
