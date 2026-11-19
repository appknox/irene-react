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

  it('spins in the brand colour unless another is asked for', () => {
    render(<AkSpinner />);

    expect(screen.getByRole('status')).toHaveClass('text-primary');
  });

  it('spins in the colour it is given', () => {
    render(<AkSpinner color="success" />);

    const spinner = screen.getByRole('status');

    expect(spinner).toHaveClass('text-success');
    expect(spinner).not.toHaveClass('text-primary');
  });

  it('takes the surrounding text colour when asked to inherit', () => {
    render(<AkSpinner color="inherit" />);

    expect(screen.getByRole('status')).toHaveClass('text-inherit');
  });

  it('lets a className override the colour, for a one-off', () => {
    render(<AkSpinner className="text-danger" />);

    const spinner = screen.getByRole('status');

    expect(spinner).toHaveClass('text-danger');
    expect(spinner).not.toHaveClass('text-primary');
  });

  it('passes through svg props', () => {
    render(<AkSpinner data-testid="spinner" aria-label="Signing in" />);

    expect(screen.getByTestId('spinner')).toHaveAccessibleName('Signing in');
  });
});
