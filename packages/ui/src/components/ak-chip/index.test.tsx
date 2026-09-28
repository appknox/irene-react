import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkChip } from '@irene/ui/ak-chip';

const chip = () => document.querySelector('[data-slot="chip"]');

describe('AkChip', () => {
  it('reads as its label', () => {
    render(<AkChip label="12" />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('sits closer to an icon than to the edge of the chip', () => {
    render(<AkChip label="Beta" icon={<span data-testid="chip-icon" />} />);

    expect(screen.getByText('Beta')).toHaveClass('ml-0.5');
  });

  it('keeps the label off the edge when there is no icon', () => {
    render(<AkChip label="Beta" />);

    expect(screen.getByText('Beta')).toHaveClass('ml-1.75');
  });

  it('renders an icon before the label', () => {
    render(<AkChip label="Beta" icon={<span data-testid="chip-icon" />} />);

    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
  });

  it('takes the smaller height where it sits beside text', () => {
    render(<AkChip label="12" size="small" />);

    expect(chip()).toHaveClass('h-5.5');
  });
});

describe('the variants a chip is drawn in', () => {
  it('fills with the colour it carries', () => {
    render(<AkChip label="12" variant="filled" color="primary" />);

    expect(chip()).toHaveClass('bg-primary');
  });

  it('outlines rather than filling unless a fill is asked for', () => {
    render(<AkChip label="12" color="primary" />);

    expect(chip()).toHaveClass('border-primary');
    expect(chip()).toHaveClass('bg-transparent');
  });

  it('tints rather than fills for a semi-filled chip, and drops the border', () => {
    render(<AkChip label="12" variant="semi-filled" color="primary" />);

    expect(chip()).toHaveClass('bg-primary/20');
    expect(chip()).toHaveClass('border-0');
  });

  it('keeps the tint and adds a border in the text colour for a semi-filled outline', () => {
    render(<AkChip label="12" variant="semi-filled-outlined" color="primary" />);

    expect(chip()).toHaveClass('bg-primary/20');
    expect(chip()).toHaveClass('border-primary-strong');
    expect(chip()).toHaveClass('text-primary-strong');
  });
});

describe('a chip that acts on a click', () => {
  it('reads as a control to a screen reader', () => {
    render(<AkChip label="Critical" button />);

    expect(screen.getByRole('button', { name: 'Critical' })).toBeInTheDocument();
  });

  it('reads as nothing in particular otherwise', () => {
    render(<AkChip label="Critical" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls back when pressed', async () => {
    const onClick = vi.fn();

    render(<AkChip label="Critical" button onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Critical' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('a chip that can be dismissed', () => {
  it('offers no dismiss control until it is given one', () => {
    render(<AkChip label="Critical" />);

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('calls back when the dismiss control is pressed', async () => {
    const onDelete = vi.fn();

    render(<AkChip label="Critical" onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('keeps the click off the chip, so dismissing one never also opens it', async () => {
    const onDelete = vi.fn();
    const onClick = vi.fn();

    render(<AkChip label="Critical" button onClick={onClick} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('tints under the pointer, so the control reads as its own target', () => {
    render(<AkChip label="Critical" onDelete={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('hover:bg-current/10');
  });

  it('takes a mark of its own in place of the close icon', () => {
    render(
      <AkChip label="Critical" onDelete={vi.fn()} deleteIcon={<span data-testid="own-mark" />} />
    );

    expect(screen.getByTestId('own-mark')).toBeInTheDocument();
  });
});

describe('how the label is set', () => {
  it('inherits the chip colour, so the label never fights the fill', () => {
    render(<AkChip label="Critical" variant="filled" color="primary" />);

    expect(screen.getByText('Critical')).toHaveClass('text-inherit');
  });

  it('takes a colour of its own when one is asked for', () => {
    render(<AkChip label="Critical" labelColor="textSecondary" />);

    expect(screen.getByText('Critical')).toHaveClass('text-foreground-muted');
  });

  it('follows the size of the chip unless a step of the scale is named', () => {
    render(<AkChip label="Critical" size="small" />);

    expect(screen.getByText('Critical')).toHaveClass('text-sm');
  });

  it('takes a step of the type scale over the size of the chip', () => {
    render(<AkChip label="Critical" labelVariant="body2" />);

    expect(screen.getByText('Critical')).toHaveClass('text-md');
    expect(screen.getByText('Critical')).not.toHaveClass('text-base');
  });

  it('takes classes of its own over the size of the chip', () => {
    render(<AkChip label="Critical" labelClassName="text-xs" />);

    expect(screen.getByText('Critical')).toHaveClass('text-xs');
    expect(screen.getByText('Critical')).not.toHaveClass('text-base');
  });

  it('takes classes of its own over a step of the scale', () => {
    render(<AkChip label="Critical" labelVariant="h6" labelClassName="text-xs" />);

    expect(screen.getByText('Critical')).toHaveClass('text-xs');
    expect(screen.getByText('Critical')).not.toHaveClass('text-base');
  });
});

describe('the weight the label is set in', () => {
  it('is regular unless another is asked for', () => {
    render(<AkChip label="Critical" />);

    expect(screen.getByText('Critical')).toHaveClass('font-normal');
  });

  it('takes the weight it is given', () => {
    render(<AkChip label="Critical" fontWeight="bold" />);

    expect(screen.getByText('Critical')).toHaveClass('font-bold');
  });
});

describe('the markup a chip renders', () => {
  it('uses a real button rather than a role, so every device treats it as one', () => {
    render(<AkChip label="Critical" button />);

    expect(screen.getByRole('button', { name: 'Critical' }).tagName).toBe('BUTTON');
    expect(document.querySelector('[role="button"]')).not.toBeInTheDocument();
  });

  it('keeps the dismiss control beside the chip button, never inside it', () => {
    render(<AkChip label="Critical" button onDelete={vi.fn()} />);

    const chipButton = document.querySelector('[data-slot="chip-button"]');

    expect(chipButton?.querySelector('button')).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});
