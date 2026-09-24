import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkInput } from '@irene/ui/ak-input';

describe('rendering', () => {
  it('renders an input with the textbox role', () => {
    render(<AkInput aria-label="ApiProject name" />);

    expect(screen.getByRole('textbox', { name: 'ApiProject name' })).toBeInTheDocument();
  });

  it('passes the type through', () => {
    render(<AkInput type="password" aria-label="Password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders a data attribute on the input', () => {
    render(<AkInput aria-label="Search" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input');
  });
});

describe('behaviour', () => {
  it('accepts typed text', async () => {
    render(<AkInput aria-label="ApiProject name" />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'irene');

    expect(input).toHaveValue('irene');
  });

  it('accepts no typed text when disabled', async () => {
    const onChange = vi.fn();
    render(<AkInput disabled onChange={onChange} aria-label="ApiProject name" />);

    await userEvent.type(screen.getByRole('textbox'), 'irene');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders aria-invalid when the value is invalid', () => {
    render(<AkInput aria-invalid aria-label="ApiProject name" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('class handling', () => {
  it('lets a caller override a conflicting class', () => {
    render(<AkInput className="h-20" aria-label="ApiProject name" />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('h-20');
    expect(input).not.toHaveClass('h-9');
  });
});

describe('errors', () => {
  it('renders the error border classes from hasError alone', () => {
    render(<AkInput hasError />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('aria-invalid:border-danger');
  });

  it('renders no message from hasError alone', () => {
    const { container } = render(<AkInput hasError />);

    expect(container.querySelector('[data-slot="input-error"]')).toBeNull();
  });

  it('renders the error message and icon under the field', () => {
    const { container } = render(<AkInput errorMessage="Account Locked Out" />);

    const message = container.querySelector('[data-slot="input-error"]');

    expect(message).toHaveTextContent('Account Locked Out');
    expect(message?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders aria-invalid from the error message alone', () => {
    render(<AkInput errorMessage="Account Locked Out" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders no aria-invalid with neither prop set', () => {
    const { container } = render(<AkInput />);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('[data-slot="input-error"]')).toBeNull();
  });

  it('applies wrapperClassName to the wrapper and className to the input', () => {
    const { container } = render(<AkInput wrapperClassName="gap-4" className="h-12" />);

    expect(container.firstChild).toHaveClass('gap-4');
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });
});

describe('the password reveal control', () => {
  const revealButton = () => screen.getByRole('button', { name: 'Show password' });

  it('renders no control on a field of any other type', () => {
    render(<AkInput type="text" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the input with type password until the control is clicked', () => {
    render(<AkInput type="password" defaultValue="hunter2" />);

    expect(document.querySelector('[data-slot="input"]')).toHaveAttribute('type', 'password');
  });

  it('renders the input with type text once the control is clicked', async () => {
    render(<AkInput type="password" defaultValue="hunter2" />);

    await userEvent.click(revealButton());

    expect(document.querySelector('[data-slot="input"]')).toHaveAttribute('type', 'text');
  });

  it('renders the input with type password again on a second click', async () => {
    render(<AkInput type="password" defaultValue="hunter2" />);

    await userEvent.click(revealButton());
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(document.querySelector('[data-slot="input"]')).toHaveAttribute('type', 'password');
  });

  it('renders the Show password and Hide password labels for each state', async () => {
    render(<AkInput type="password" />);

    expect(revealButton()).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(revealButton());

    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('renders the control disabled while the field is disabled', () => {
    render(<AkInput type="password" disabled />);

    expect(revealButton()).toBeDisabled();
  });
});
