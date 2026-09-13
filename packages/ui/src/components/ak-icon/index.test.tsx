import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkIcon } from '@irene/ui/ak-icon';

const svgFor = (container: HTMLElement) => container.querySelector('svg');

describe('rendering', () => {
  it('renders the named icon from the bundled sets', () => {
    const { container } = render(<AkIcon name="material-symbols:check" />);
    const svg = svgFor(container);

    // A path only exists when the icon resolved locally. Had registration not
    // run, Iconify would render an empty placeholder and reach for its API.
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('defaults to 1em so it tracks the surrounding text', () => {
    const { container } = render(<AkIcon name="material-symbols:check" />);

    expect(svgFor(container)).toHaveAttribute('width', '1em');
  });

  it('takes an explicit size', () => {
    const { container } = render(<AkIcon name="material-symbols:check" size="32px" />);
    const svg = svgFor(container);

    expect(svg).toHaveAttribute('width', '32px');
    expect(svg).toHaveAttribute('height', '32px');
  });

  it('is hidden from assistive technology', () => {
    const { container } = render(<AkIcon name="material-symbols:check" />);

    expect(svgFor(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('resolves icons from a second set', () => {
    const { container } = render(<AkIcon name="mdi:delete" />);

    expect(svgFor(container)?.querySelector('path')).toBeInTheDocument();
  });
});

describe('class handling', () => {
  it('keeps its layout classes alongside a caller class', () => {
    const { container } = render(<AkIcon name="material-symbols:check" className="text-danger" />);
    const svg = svgFor(container);

    expect(svg).toHaveClass('text-danger');
    expect(svg).toHaveClass('shrink-0');
  });
});

describe('labelled use', () => {
  it('can be given a label when it carries meaning on its own', () => {
    render(
      <AkIcon name="material-symbols:check" aria-hidden={false} aria-label="Passed" role="img" />
    );

    expect(screen.getByRole('img', { name: 'Passed' })).toBeInTheDocument();
  });
});
