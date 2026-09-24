import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkProgressLinear } from '@irene/ui/ak-progress-linear';

const bar = (container: HTMLElement) =>
  container.querySelector<HTMLProgressElement>('[data-slot="progress-linear"]');

describe('AkProgressLinear', () => {
  it('renders aria-valuenow from the value', () => {
    const { container, getByRole } = render(<AkProgressLinear value={40} />);

    expect(getByRole('progressbar')).toBeInTheDocument();
    expect(bar(container)?.value).toBe(40);
    expect(bar(container)?.max).toBe(100);
  });

  it('renders no aria-valuenow when no value is given', () => {
    const { container } = render(<AkProgressLinear />);

    expect(bar(container)?.hasAttribute('value')).toBe(false);
  });

  it('clamps a value outside 0 to 100 into the range', () => {
    const { container, rerender } = render(<AkProgressLinear value={140} />);

    expect(bar(container)?.value).toBe(100);

    rerender(<AkProgressLinear value={-20} />);

    expect(bar(container)?.value).toBe(0);
  });

  it('renders the label', () => {
    const { getByRole } = render(<AkProgressLinear label="Loading your dashboard" />);

    expect(getByRole('progressbar')).toHaveAccessibleName('Loading your dashboard');
  });
});
