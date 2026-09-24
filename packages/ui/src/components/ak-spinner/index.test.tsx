import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkSpinner } from '@irene/ui/ak-spinner';

describe('AkSpinner', () => {
  it('renders with the status role', () => {
    render(<AkSpinner />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders at the default size', () => {
    render(<AkSpinner />);

    const spinner = screen.getByRole('status');

    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('size-4');
  });

  it('renders at the size the caller sets', () => {
    render(<AkSpinner className="size-8" />);

    const spinner = screen.getByRole('status');

    expect(spinner).toHaveClass('size-8');
    expect(spinner).not.toHaveClass('size-4');
  });

  it('passes through svg props', () => {
    render(<AkSpinner data-testid="spinner" aria-label="Signing in" />);

    expect(screen.getByTestId('spinner')).toHaveAccessibleName('Signing in');
  });
});
