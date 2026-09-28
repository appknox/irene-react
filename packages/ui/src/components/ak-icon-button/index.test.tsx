import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkIconButton } from '@irene/ui/ak-icon-button';

describe('AkIconButton', () => {
  it('reads as the label it is given, since the icon carries no text', () => {
    render(
      <AkIconButton aria-label="Refresh">
        <span data-testid="icon" />
      </AkIconButton>
    );

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('submits nothing unless it is asked to', () => {
    render(<AkIconButton aria-label="Refresh" />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('takes a type of its own', () => {
    render(<AkIconButton aria-label="Save" type="submit" />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when it is pressed', async () => {
    const onClick = vi.fn();

    render(<AkIconButton aria-label="Refresh" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick while it is disabled', async () => {
    const onClick = vi.fn();

    render(<AkIconButton aria-label="Refresh" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is transparent and tints on hover unless it is outlined', () => {
    render(<AkIconButton aria-label="Refresh" />);

    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'hover:bg-hover-light');
  });

  it('draws a border when it is outlined', () => {
    render(<AkIconButton aria-label="Refresh" variant="outlined" />);

    expect(screen.getByRole('button')).toHaveClass('border', 'border-border-strong');
  });

  it.each(['primary', 'secondary'] as const)('draws a %s border when asked for', (borderColor) => {
    render(<AkIconButton aria-label="Refresh" variant="outlined" borderColor={borderColor} />);

    expect(screen.getByRole('button')).toHaveClass(`border-${borderColor}`);
  });

  it('leaves the border colour alone while it is not outlined', () => {
    render(<AkIconButton aria-label="Refresh" borderColor="primary" />);

    expect(screen.getByRole('button')).not.toHaveClass('border-primary');
  });

  it('is medium unless another size is asked for', () => {
    render(<AkIconButton aria-label="Refresh" />);

    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'medium');
    expect(screen.getByRole('button')).toHaveClass('p-1.5');
  });

  it('tightens its padding and its icon at the small size', () => {
    render(<AkIconButton aria-label="Refresh" size="small" />);

    expect(screen.getByRole('button')).toHaveClass('p-1.25', '[&_svg]:size-4.5');
  });

  it('takes classes of its own over the variant', () => {
    render(<AkIconButton aria-label="Refresh" className="rounded-full" />);

    expect(screen.getByRole('button')).toHaveClass('rounded-full');
    expect(screen.getByRole('button')).not.toHaveClass('rounded-sm');
  });
});
