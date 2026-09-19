import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkInput } from '@irene/ui/ak-input';

describe('rendering', () => {
  it('renders a text box', () => {
    render(<AkInput aria-label="ApiProject name" />);

    expect(screen.getByRole('textbox', { name: 'ApiProject name' })).toBeInTheDocument();
  });

  it('passes the type through', () => {
    render(<AkInput type="password" aria-label="Password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('marks itself for styling hooks', () => {
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

  it('does not accept input when disabled', async () => {
    const onChange = vi.fn();
    render(<AkInput disabled onChange={onChange} aria-label="ApiProject name" />);

    await userEvent.type(screen.getByRole('textbox'), 'irene');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('reports an invalid value to assistive technology', () => {
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
  it('colours the border from hasError alone', () => {
    render(<AkInput hasError />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('aria-invalid:border-danger');
  });

  it('shows no message for hasError alone', () => {
    const { container } = render(<AkInput hasError />);

    expect(container.querySelector('[data-slot="input-error"]')).toBeNull();
  });

  it('shows the message under the field, with its icon', () => {
    const { container } = render(<AkInput errorMessage="Account Locked Out" />);

    const message = container.querySelector('[data-slot="input-error"]');

    expect(message).toHaveTextContent('Account Locked Out');
    expect(message?.querySelector('svg')).toBeInTheDocument();
  });

  it('marks the field invalid from the message alone', () => {
    render(<AkInput errorMessage="Account Locked Out" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('stays valid with neither prop', () => {
    const { container } = render(<AkInput />);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('[data-slot="input-error"]')).toBeNull();
  });

  it('takes classes for the wrapper separately from the field', () => {
    const { container } = render(<AkInput wrapperClassName="gap-4" className="h-12" />);

    expect(container.firstChild).toHaveClass('gap-4');
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });
});
