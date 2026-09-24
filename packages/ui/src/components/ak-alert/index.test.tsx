import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkAlert, AkAlertDescription, AkAlertTitle } from '@irene/ui/ak-alert';
import { akAlertVariants } from '@irene/ui/ak-alert/variants';

describe('rendering', () => {
  it('renders with the alert role', () => {
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

  it('renders a data attribute on each part', () => {
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

describe('dismissing', () => {
  it('renders no close button without onDismiss', () => {
    render(<AkAlert>Body</AkAlert>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a close button when onDismiss is given', () => {
    render(<AkAlert onDismiss={vi.fn()}>Body</AkAlert>);

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is pressed', async () => {
    const onDismiss = vi.fn();

    render(<AkAlert onDismiss={onDismiss}>Body</AkAlert>);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders the close label the caller passes', () => {
    render(
      <AkAlert onDismiss={vi.fn()} dismissLabel="閉じる">
        Body
      </AkAlert>
    );

    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });

  it('renders the close button centred on the top-right corner', () => {
    render(<AkAlert onDismiss={vi.fn()}>Body</AkAlert>);

    const button = screen.getByRole('button', { name: 'Close' });

    // Negative offsets, so the button straddles the corner rather than sitting inside it.
    expect(button.className).toMatch(/-top-\d/);
    expect(button.className).toMatch(/-right-\d/);
  });
});

describe('variants', () => {
  it('renders the neutral variant by default', () => {
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

  it('returns the variant classes without rendering a component', () => {
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
