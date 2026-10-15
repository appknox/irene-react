import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkToggle } from '@irene/ui/ak-toggle';

describe('AkToggle', () => {
  it('reads as a switch, off unless told otherwise', () => {
    render(<AkToggle aria-label="Email me" />);

    expect(screen.getByRole('switch', { name: 'Email me' })).not.toBeChecked();
  });

  it('reports the new state when flipped', async () => {
    const onCheckedChange = vi.fn();

    render(<AkToggle aria-label="Email me" onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('follows the state it is given rather than its own', async () => {
    render(<AkToggle aria-label="Email me" checked={false} onCheckedChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('switch'));

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('flips on Space, as a switch does', async () => {
    const onCheckedChange = vi.fn();

    render(<AkToggle aria-label="Email me" onCheckedChange={onCheckedChange} />);

    screen.getByRole('switch').focus();
    await userEvent.keyboard(' ');

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('stays where it is while disabled', async () => {
    const onCheckedChange = vi.fn();

    render(<AkToggle aria-label="Email me" disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('draws green when on and grey when off', () => {
    render(<AkToggle aria-label="Email me" defaultChecked />);

    expect(screen.getByRole('switch')).toHaveClass('data-[state=checked]:bg-success');
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
  });

  it('takes the small height beside body text', () => {
    render(<AkToggle aria-label="Email me" size="small" />);

    expect(screen.getByRole('switch')).toHaveClass('h-4', 'w-8');
  });
});
