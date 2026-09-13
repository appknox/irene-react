import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkButton } from '.';
import { akButtonVariants } from './variants';

describe('rendering', () => {
  it('renders its children in a button', () => {
    render(<AkButton>Scan now</AkButton>);

    expect(screen.getByRole('button', { name: 'Scan now' })).toBeInTheDocument();
  });

  it('defaults to the default variant and size', () => {
    render(<AkButton>Scan</AkButton>);

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('records the variant and size it was given', () => {
    render(
      <AkButton variant="destructive" size="sm">
        Delete
      </AkButton>
    );

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('renders as another element with asChild', () => {
    render(
      <AkButton asChild>
        <a href="/projects">Projects</a>
      </AkButton>
    );

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('class handling', () => {
  it('applies the variant classes', () => {
    render(<AkButton variant="destructive">Delete</AkButton>);

    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('lets a caller override a conflicting class', () => {
    // cn resolves the conflict, so the caller's padding wins rather than both
    // landing and the outcome depending on stylesheet order.
    render(<AkButton className="px-8">Wide</AkButton>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('px-8');
    expect(button).not.toHaveClass('px-4');
  });

  it('keeps classes that do not conflict', () => {
    render(<AkButton className="w-full">Block</AkButton>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('inline-flex');
  });
});

describe('behaviour', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<AkButton onClick={onClick}>Scan</AkButton>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <AkButton disabled onClick={onClick}>
        Scan
      </AkButton>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('passes through arbitrary button props', () => {
    render(
      <AkButton type="submit" aria-label="Submit the form">
        Go
      </AkButton>
    );

    expect(screen.getByRole('button', { name: 'Submit the form' })).toHaveAttribute(
      'type',
      'submit'
    );
  });
});

describe('akButtonVariants used on its own', () => {
  it('produces the classes for a variant without rendering a button', () => {
    expect(akButtonVariants({ variant: 'link' })).toContain('underline-offset-4');
  });
});
