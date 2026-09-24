import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkTypography } from '@irene/ui/ak-typography';

const text = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="typography"]');

describe('AkTypography', () => {
  it('renders the body variant when none is given', () => {
    const { container } = render(<AkTypography>Hello</AkTypography>);

    expect(text(container)?.tagName).toBe('P');
    expect(text(container)).toHaveClass('text-base', 'font-normal');
  });

  it.each([
    ['h1', 'H1'],
    ['h4', 'H4'],
    ['h6', 'H6'],
  ] as const)('renders %s as its own heading element', (variant, tagName) => {
    const { container } = render(<AkTypography variant={variant}>Title</AkTypography>);

    expect(text(container)?.tagName).toBe(tagName);
  });

  it.each([
    ['subtitle1', 'H6'],
    ['subtitle2', 'H6'],
    ['body2', 'P'],
  ] as const)('renders %s as %s, matching the design system', (variant, tagName) => {
    const { container } = render(<AkTypography variant={variant}>Text</AkTypography>);

    expect(text(container)?.tagName).toBe(tagName);
  });

  it('renders a heading element for a heading variant', () => {
    render(<AkTypography variant="h3">Findings</AkTypography>);

    expect(screen.getByRole('heading', { name: 'Findings' })).toBeInTheDocument();
  });

  it('renders the element the tag prop names, keeping the variant classes', () => {
    const { container } = render(
      <AkTypography variant="h5" tag="span">
        Inline
      </AkTypography>
    );

    expect(text(container)?.tagName).toBe('SPAN');
    expect(text(container)).toHaveClass('text-lg', 'font-bold');
  });

  it('lets a caller override the weight the variant sets', () => {
    const { container } = render(
      <AkTypography variant="h5" fontWeight="light">
        Light
      </AkTypography>
    );

    expect(text(container)).toHaveClass('font-light');
    expect(text(container)).not.toHaveClass('font-bold');
  });

  it('lets a caller override the size with a class', () => {
    const { container } = render(
      <AkTypography variant="h4" className="text-xl">
        Smaller
      </AkTypography>
    );

    expect(text(container)).toHaveClass('text-xl');
    expect(text(container)).not.toHaveClass('text-2xl');
  });

  it.each([
    ['error', 'text-danger'],
    ['textSecondary', 'text-foreground-muted'],
    ['primary', 'text-primary'],
  ] as const)('tints %s', (color, className) => {
    const { container } = render(<AkTypography color={color}>Coloured</AkTypography>);

    expect(text(container)).toHaveClass(className);
  });

  it('truncates to one line with noWrap', () => {
    const { container } = render(<AkTypography noWrap>A very long line</AkTypography>);

    expect(text(container)).toHaveClass('truncate');
  });

  it('passes arbitrary attributes through to the element', () => {
    const { container } = render(
      <AkTypography id="intro" data-test-intro>
        Text
      </AkTypography>
    );

    expect(text(container)).toHaveAttribute('id', 'intro');
    expect(text(container)).toHaveAttribute('data-test-intro');
  });
});
