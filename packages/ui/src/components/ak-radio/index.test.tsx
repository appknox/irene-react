import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkLabel } from '@irene/ui/ak-label';
import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';

/** The three choices, each with a label a user can press. */
function Choices({ onValueChange }: Readonly<{ onValueChange?: (value: string) => void }>) {
  return (
    <AkRadioGroup defaultValue="cloud" onValueChange={onValueChange}>
      <AkLabel htmlFor="cloud">Cloud</AkLabel>

      <AkRadio id="cloud" value="cloud" />

      <AkLabel htmlFor="data-center">Data centre</AkLabel>

      <AkRadio id="data-center" value="data-center" />

      <AkLabel htmlFor="security">Security</AkLabel>

      <AkRadio id="security" value="security" disabled />
    </AkRadioGroup>
  );
}

describe('AkRadioGroup', () => {
  it('is announced as a radio group holding its buttons', () => {
    render(<Choices />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the button the group opens on', () => {
    render(<Choices />);

    expect(screen.getByRole('radio', { name: 'Cloud' })).toBeChecked();
  });

  it('reports the choice when another button is pressed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Choices onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: 'Data centre' }));

    expect(onValueChange).toHaveBeenCalledWith('data-center');
  });

  it('leaves a disabled button unchoosable', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Choices onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: 'Security' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
