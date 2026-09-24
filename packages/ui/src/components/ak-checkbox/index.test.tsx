import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkCheckbox } from '@irene/ui/ak-checkbox';

describe('AkCheckbox', () => {
  it('renders a checkbox', () => {
    render(<AkCheckbox />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('calls onCheckedChange with the new state when clicked', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('renders the tick when checked', () => {
    render(<AkCheckbox checked />);

    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
  });

  it('renders the indeterminate mark when checked is indeterminate', () => {
    render(<AkCheckbox checked="indeterminate" />);

    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'indeterminate');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('moves an indeterminate box to checked when clicked', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox checked="indeterminate" onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('applies the color classes once checked', () => {
    render(<AkCheckbox checked color="error" />);

    expect(screen.getByRole('checkbox')).toHaveClass('data-[state=checked]:bg-danger');
  });

  it('calls no handler when clicked while disabled', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
