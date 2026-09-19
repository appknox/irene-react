import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkDivider } from '@irene/ui/ak-divider';

const divider = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="divider"]');

describe('AkDivider', () => {
  it('renders an hr when it lies flat', () => {
    const { container } = render(<AkDivider />);

    expect(divider(container)?.tagName).toBe('HR');
  });

  it('renders a div when it stands up, since an hr cannot', () => {
    const { container } = render(<AkDivider direction="vertical" />);

    expect(divider(container)?.tagName).toBe('DIV');
  });

  it('reads as a separator either way', () => {
    const { rerender } = render(<AkDivider />);

    expect(screen.getByRole('separator')).toBeInTheDocument();

    rerender(<AkDivider direction="vertical" />);

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('is faint by default and stronger when asked', () => {
    const { container, rerender } = render(<AkDivider />);

    expect(divider(container)).toHaveClass('border-divider');

    rerender(<AkDivider color="dark" />);

    expect(divider(container)).toHaveClass('border-divider-strong');
  });

  it('puts the border on the bottom when flat and the left when upright', () => {
    const { container, rerender } = render(<AkDivider />);

    expect(divider(container)).toHaveClass('border-b');

    rerender(<AkDivider direction="vertical" />);

    expect(divider(container)).toHaveClass('border-l');
  });

  it('insets itself with the middle variant', () => {
    const { container } = render(<AkDivider variant="middle" />);

    expect(divider(container)).toHaveClass('mx-4');
  });

  it('lets a caller override a conflicting class', () => {
    const { container } = render(<AkDivider className="w-1/2" />);

    expect(divider(container)).toHaveClass('w-1/2');
    expect(divider(container)).not.toHaveClass('w-full');
  });

  it('passes arbitrary attributes through', () => {
    const { container } = render(<AkDivider data-test-rule />);

    expect(divider(container)).toHaveAttribute('data-test-rule');
  });
});
