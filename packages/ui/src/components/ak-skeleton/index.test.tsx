import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkSkeleton } from '@irene/ui/ak-skeleton';

import styles from '@irene/ui/ak-skeleton/styles.module.css';

/* jsdom resolves rem against its own 16px root, so assertions read the authored value. */
const skeleton = (container: HTMLElement) =>
  container.querySelector<HTMLSpanElement>('[data-slot="skeleton"]');

describe('AkSkeleton', () => {
  it('renders full width and one line of height by default', () => {
    const { container } = render(<AkSkeleton />);

    expect(skeleton(container)?.style.width).toBe('100%');
    expect(skeleton(container)?.style.height).toBe('1.2rem');
  });

  it('takes any CSS width and height', () => {
    const { container } = render(<AkSkeleton width="8rem" height="2.25rem" />);

    expect(skeleton(container)?.style.width).toBe('8rem');
    expect(skeleton(container)?.style.height).toBe('2.25rem');
  });

  it('renders rounded corners by default', () => {
    const { container } = render(<AkSkeleton />);

    expect(skeleton(container)).toHaveClass('rounded-sm');
  });

  it.each([
    ['circular', 'rounded-full'],
    ['rectangular', 'rounded-sm'],
  ] as const)('renders the %s variant', (variant, className) => {
    const { container } = render(<AkSkeleton variant={variant} />);

    const element = skeleton(container);

    if (variant === 'circular') {
      expect(element).toHaveClass(className);
    } else {
      expect(element).not.toHaveClass('rounded-full');
    }
  });

  it('renders the pulse animation', () => {
    const { container } = render(<AkSkeleton />);

    expect(skeleton(container)).toHaveClass(styles.pulse);
  });

  it('renders aria-hidden, leaving the surrounding live region to announce the wait', () => {
    const { container } = render(<AkSkeleton />);

    expect(skeleton(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('lets a caller override a conflicting class', () => {
    const { container } = render(<AkSkeleton className="rounded-full" />);

    expect(skeleton(container)).toHaveClass('rounded-full');
    expect(skeleton(container)).not.toHaveClass('rounded-sm');
  });

  it('keeps an inline style the caller sets alongside the size', () => {
    const { container } = render(<AkSkeleton width="4rem" style={{ marginTop: '8px' }} />);

    expect(skeleton(container)?.style.width).toBe('4rem');
    expect(skeleton(container)?.style.marginTop).toBe('8px');
  });
});
