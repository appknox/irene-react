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

  it('records the variant, color and size it was given', () => {
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

  it('tints an outlined button with its color', () => {
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

describe('loading', () => {
  it('shows a spinner and disables the button', () => {
    render(<AkButton loading>Login</AkButton>);

    const button = screen.getByRole('button', { name: 'Login' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps its label while loading, so the button does not resize', () => {
    render(<AkButton loading>Login</AkButton>);

    expect(screen.getByRole('button')).toHaveTextContent('Login');
  });

  it('does not fire while loading', async () => {
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

  it('keeps its colour while loading rather than looking unavailable', () => {
    render(<AkButton loading>Login</AkButton>);

    // The disabled background only applies to a button that is not loading.
    expect(screen.getByRole('button')).toHaveClass('disabled:not-data-loading:bg-disabled-button');
  });

  it('has no spinner when it is not loading', () => {
    render(<AkButton>Login</AkButton>);

    expect(screen.getByRole('button').querySelector('svg')).toBeNull();
  });
});

describe('akButtonVariants used on its own', () => {
  it('produces the classes for a variant without rendering a button', () => {
    expect(akButtonVariants({ variant: 'text', color: 'primary' })).toContain('text-primary');
  });
});
