import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkAlert, AkAlertDescription, AkAlertTitle } from '@irene/ui/ak-alert';
import { akAlertVariants } from '@irene/ui/ak-alert/variants';

describe('rendering', () => {
  it('announces itself as an alert', () => {
    render(
      <AkAlert>
        <AkAlertTitle>Scan failed</AkAlertTitle>
      </AkAlert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders a title and a description', () => {
    render(
      <AkAlert>
        <AkAlertTitle>Scan failed</AkAlertTitle>
        <AkAlertDescription>The binary could not be read.</AkAlertDescription>
      </AkAlert>
    );

    expect(screen.getByText('Scan failed')).toBeInTheDocument();
    expect(screen.getByText('The binary could not be read.')).toBeInTheDocument();
  });

  it('marks each part for styling hooks', () => {
    render(
      <AkAlert>
        <AkAlertTitle>Scan failed</AkAlertTitle>
        <AkAlertDescription>Details</AkAlertDescription>
      </AkAlert>
    );

    expect(screen.getByRole('alert')).toHaveAttribute('data-slot', 'alert');
    expect(screen.getByText('Scan failed')).toHaveAttribute('data-slot', 'alert-title');
    expect(screen.getByText('Details')).toHaveAttribute('data-slot', 'alert-description');
  });
});

describe('variants', () => {
  it('defaults to the neutral surface', () => {
    render(<AkAlert>Body</AkAlert>);

    expect(screen.getByRole('alert')).toHaveClass('bg-background');
  });

  it.each([
    ['error', 'bg-danger-surface'],
    ['warning', 'bg-warning-surface'],
    ['success', 'bg-success-surface'],
    ['info', 'bg-info-surface'],
  ] as const)('tints the %s variant', (variant, surface) => {
    render(<AkAlert variant={variant}>Body</AkAlert>);

    expect(screen.getByRole('alert')).toHaveClass(surface);
  });

  it('produces classes without rendering', () => {
    expect(akAlertVariants({ variant: 'error' })).toContain('text-danger');
  });
});

describe('class handling', () => {
  it('lets a caller override a conflicting class', () => {
    render(<AkAlert className="px-8">Body</AkAlert>);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveClass('px-8');
    expect(alert).not.toHaveClass('px-4');
  });
});
