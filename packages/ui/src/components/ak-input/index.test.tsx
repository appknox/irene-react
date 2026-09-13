import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkInput } from '@irene/ui/ak-input';

describe('rendering', () => {
  it('renders a text box', () => {
    render(<AkInput aria-label="Project name" />);

    expect(screen.getByRole('textbox', { name: 'Project name' })).toBeInTheDocument();
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
    render(<AkInput aria-label="Project name" />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'irene');

    expect(input).toHaveValue('irene');
  });

  it('does not accept input when disabled', async () => {
    const onChange = vi.fn();
    render(<AkInput disabled onChange={onChange} aria-label="Project name" />);

    await userEvent.type(screen.getByRole('textbox'), 'irene');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('reports an invalid value to assistive technology', () => {
    render(<AkInput aria-invalid aria-label="Project name" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('class handling', () => {
  it('lets a caller override a conflicting class', () => {
    render(<AkInput className="h-20" aria-label="Project name" />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('h-20');
    expect(input).not.toHaveClass('h-9');
  });
});
