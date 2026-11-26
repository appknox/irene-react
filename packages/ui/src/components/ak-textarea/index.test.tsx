import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkTextarea } from '@irene/ui/ak-textarea';

describe('AkTextarea', () => {
  it('takes what is typed into it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<AkTextarea aria-label="Description" rows={6} onChange={onChange} />);

    await user.type(screen.getByLabelText('Description'), 'Used by the build');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Description')).toHaveValue('Used by the build');
  });

  it('shows the message under the field and marks it invalid', () => {
    render(<AkTextarea aria-label="Description" errorMessage="Required" />);

    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
  });

  it('colours the border without a message where it is only marked', () => {
    render(<AkTextarea aria-label="Description" hasError />);

    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('cannot be typed into while disabled', async () => {
    const user = userEvent.setup();

    render(<AkTextarea aria-label="Description" disabled />);

    await user.type(screen.getByLabelText('Description'), 'anything');

    expect(screen.getByLabelText('Description')).toHaveValue('');
  });
});
