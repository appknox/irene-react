import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkCheckbox } from '@irene/ui/ak-checkbox';

describe('AkCheckbox', () => {
  it('renders a checkbox', () => {
    render(<AkCheckbox />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('reports the new state when clicked', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('renders the tick when checked', () => {
    render(<AkCheckbox checked />);

    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
  });

  it('renders the part-ticked mark when indeterminate', () => {
    render(<AkCheckbox checked="indeterminate" />);

    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'indeterminate');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('ticks a part-ticked box when clicked', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox checked="indeterminate" onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('takes the colour it is given once ticked', () => {
    render(<AkCheckbox checked color="error" />);

    expect(screen.getByRole('checkbox')).toHaveClass('data-[state=checked]:bg-danger');
  });

  it('reports nothing when clicked while disabled', async () => {
    const onCheckedChange = vi.fn();

    render(<AkCheckbox disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
