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

  it('keeps a link opened in a new tab from reaching back through the opener', () => {
    render(
      <AkLink href="https://appknox.com" target="_blank">
        Appknox
      </AkLink>
    );

    expect(screen.getByRole('link', { name: 'Appknox' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
  });

  it('keeps the relationship it was given on a link opened in a new tab', () => {
    render(
      <AkLink href="https://appknox.com" target="_blank" rel="license">
        Appknox
      </AkLink>
    );

    expect(screen.getByRole('link', { name: 'Appknox' })).toHaveAttribute('rel', 'license');
  });

  it('leaves a link that opens in place without a relationship', () => {
    render(<AkLink href="https://appknox.com">Appknox</AkLink>);

    expect(screen.getByRole('link', { name: 'Appknox' })).not.toHaveAttribute('rel');
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
