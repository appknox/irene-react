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

  it('defaults to a filled primary button', () => {
    render(<AkButton>Scan</AkButton>);

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-variant', 'filled');
    expect(button).toHaveAttribute('data-color', 'primary');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('renders the data attributes for the variant, color and size it was given', () => {
    render(
      <AkButton variant="outlined" color="error" size="sm">
        Delete
      </AkButton>
    );

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-variant', 'outlined');
    expect(button).toHaveAttribute('data-color', 'error');
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
  it('applies the classes for the variant and color together', () => {
    render(<AkButton color="error">Delete</AkButton>);

    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });

  it('applies the color classes to an outlined button', () => {
    render(
      <AkButton variant="outlined" color="primary">
        Login using SSO
      </AkButton>
    );

    const button = screen.getByRole('button');

    expect(button).toHaveClass('border-primary');
    expect(button).toHaveClass('text-primary');
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

  it('does not call onClick when disabled', async () => {
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

describe('noPadding', () => {
  it('renders no padding with noPadding', () => {
    render(<AkButton noPadding>Register Today</AkButton>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('p-0');
    expect(button).not.toHaveClass('px-4');
  });

  it('keeps its padding by default', () => {
    render(<AkButton>Login</AkButton>);

    expect(screen.getByRole('button')).toHaveClass('px-4');
  });

  it('still lets a caller set their own padding', () => {
    render(
      <AkButton noPadding className="px-2">
        Login
      </AkButton>
    );

    expect(screen.getByRole('button')).toHaveClass('px-2');
  });
});

describe('loading', () => {
  it('shows a spinner and disables the button', () => {
    render(<AkButton loading>Login</AkButton>);

    const button = screen.getByRole('button', { name: 'Login' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps the label rendered while loading, so the width does not change', () => {
    render(<AkButton loading>Login</AkButton>);

    expect(screen.getByRole('button')).toHaveTextContent('Login');
  });

  it('does not call onClick while loading', async () => {
    const onClick = vi.fn();

    render(
      <AkButton loading onClick={onClick}>
        Login
      </AkButton>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(['filled', 'outlined', 'text'] as const)('loads in the %s variant', (variant) => {
    render(
      <AkButton variant={variant} loading>
        Login
      </AkButton>
    );

    const button = screen.getByRole('button', { name: 'Login' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-loading');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps the color classes while loading', () => {
    render(<AkButton loading>Login</AkButton>);

    // The disabled background only applies to a button that is not loading.
    expect(screen.getByRole('button')).toHaveClass('disabled:not-data-loading:bg-disabled-button');
  });

  it('renders no spinner when loading is false', () => {
    render(<AkButton>Login</AkButton>);

    expect(screen.getByRole('button').querySelector('svg')).toBeNull();
  });
});

describe('akButtonVariants used on its own', () => {
  it('produces the classes for a variant without rendering a button', () => {
    expect(akButtonVariants({ variant: 'text', color: 'primary' })).toContain('text-primary');
  });

  it('renders aria-disabled on a link, which takes no disabled attribute', () => {
    render(
      <AkButton asChild disabled>
        <a href="/projects">Projects</a>
      </AkButton>
    );

    const link = screen.getByRole('link', { name: 'Projects' });

    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled');
    expect(link).toHaveClass('pointer-events-none');
    expect(link).not.toHaveAttribute('disabled');
  });

  it('renders no aria-disabled on an enabled link', () => {
    render(
      <AkButton asChild>
        <a href="/projects">Projects</a>
      </AkButton>
    );

    const link = screen.getByRole('link', { name: 'Projects' });

    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('data-disabled');
    expect(link).not.toHaveClass('pointer-events-none');
  });
});
