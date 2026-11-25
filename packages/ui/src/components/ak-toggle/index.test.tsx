import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkToggle } from '@irene/ui/ak-toggle';

describe('AkToggle', () => {
  it('is a switch, so it is announced as one and reachable by keyboard', () => {
    render(<AkToggle aria-label="Mandatory MFA" />);

    expect(screen.getByRole('switch', { name: 'Mandatory MFA' })).toBeInTheDocument();
  });

  it('reports being moved', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<AkToggle aria-label="Mandatory MFA" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('says whether it is on', () => {
    render(<AkToggle aria-label="Mandatory MFA" checked onCheckedChange={vi.fn()} />);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('cannot be moved while it is disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<AkToggle aria-label="Mandatory MFA" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  /* Each size is twice as wide as it is tall, which is what keeps the thumb round. */
  it('draws the size it is given', () => {
    render(<AkToggle aria-label="Mandatory MFA" size="small" />);

    expect(screen.getByRole('switch')).toHaveClass('h-4.25', 'w-8.5');
  });
});
