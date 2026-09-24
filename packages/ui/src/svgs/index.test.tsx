import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentProps, FunctionComponent } from 'react';

import NoResult from '@irene/ui/svgs/no-result.svg?react';

// Type of a SVG module imported with `?react`.
type SvgModule = { default: FunctionComponent<ComponentProps<'svg'>> };

// All SVGs in the `svgs` directory.
const svgs = Object.entries(
  import.meta.glob<SvgModule>('./**/*.svg', { query: '?react', eager: true })
);

/** Renders an SVG, and returns the <svg> element. */
const renderSvg = (Svg: SvgModule['default'], props: ComponentProps<'svg'> = {}) =>
  render(<Svg {...props} />).container.querySelector('svg');

/**
 *
 * =================================
 * TEST START
 * =================================
 *
 * */
describe('svgs', () => {
  it('bundles 103 SVG files', () => {
    expect(svgs).toHaveLength(103);
  });

  it.each(svgs)('%s renders an <svg> that keeps its viewBox', (_, { default: Svg }) => {
    const svg = renderSvg(Svg);

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');
  });

  it('passes className, width and aria-hidden through to the <svg>', () => {
    const svg = renderSvg(NoResult, { className: 'size-10', width: 40, 'aria-hidden': true });

    expect(svg).toHaveClass('size-10');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives each file its own element ids, so two SVGs on one page cannot clash', () => {
    const owners = new Map<string, string>();

    for (const [file, { default: Svg }] of svgs) {
      const ids = [...(renderSvg(Svg)?.querySelectorAll('[id]') ?? [])].map((node) => node.id);

      for (const id of ids) {
        expect(owners.get(id) ?? file).toBe(file);
        owners.set(id, file);
      }
    }
  });
});
