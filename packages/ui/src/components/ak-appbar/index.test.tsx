import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkAppbar } from '@irene/ui/ak-appbar';

describe('AkAppbar', () => {
  it('reads as the page banner, so a screen reader can skip to it', () => {
    render(<AkAppbar>Appknox</AkAppbar>);

    expect(screen.getByRole('banner')).toHaveTextContent('Appknox');
  });

  it('is drawn on the page background with a rule beneath it', () => {
    render(<AkAppbar />);

    expect(screen.getByRole('banner')).toHaveClass('bg-background', 'border-b');
  });

  it('takes the inverse surface when it is dark', () => {
    render(<AkAppbar color="dark" />);

    expect(screen.getByRole('banner')).toHaveClass('bg-background-inverse', 'text-white');
  });

  it('sits in the page rather than over it unless it is positioned', () => {
    render(<AkAppbar />);

    expect(screen.getByRole('banner')).toHaveClass('static');
  });

  it('pins to the top edge when it is made sticky', () => {
    render(<AkAppbar position="sticky" />);

    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0');
  });

  it('pins to the bottom edge when it is placed there', () => {
    render(<AkAppbar position="fixed" placement="bottom" />);

    expect(screen.getByRole('banner')).toHaveClass('fixed', 'bottom-0');
  });

  it('carries its own padding, which a caller can drop', () => {
    const { rerender } = render(<AkAppbar />);

    expect(screen.getByRole('banner')).toHaveClass('px-3.5');

    rerender(<AkAppbar gutter={false} />);

    expect(screen.getByRole('banner')).not.toHaveClass('px-3.5');
  });

  it('lifts off the page when asked, for a bar the page scrolls under', () => {
    const { rerender } = render(<AkAppbar />);

    expect(screen.getByRole('banner').className).not.toContain('elevated');

    rerender(<AkAppbar elevation />);

    expect(screen.getByRole('banner').className).toContain('elevated');
  });

  it('takes classes of its own over the variant', () => {
    render(<AkAppbar className="bg-primary" />);

    expect(screen.getByRole('banner')).toHaveClass('bg-primary');
    expect(screen.getByRole('banner')).not.toHaveClass('bg-background');
  });
});
