import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';

function Platforms(props: Readonly<Parameters<typeof AkRadioGroup>[0]>) {
  return (
    <AkRadioGroup aria-label="Platform" {...props}>
      <label>
        <AkRadio value="android" />
        Android
      </label>

      <label>
        <AkRadio value="ios" />
        iOS
      </label>
    </AkRadioGroup>
  );
}

describe('AkRadio', () => {
  it('reads as a group of radios named by their labels', () => {
    render(<Platforms />);

    expect(screen.getByRole('radiogroup', { name: 'Platform' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Android' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'iOS' })).not.toBeChecked();
  });

  it('reports the option chosen by clicking its label', async () => {
    const onValueChange = vi.fn();

    render(<Platforms onValueChange={onValueChange} />);

    await userEvent.click(screen.getByText('iOS'));

    expect(onValueChange).toHaveBeenCalledWith('ios');
  });

  it('marks the option it is given as chosen', () => {
    render(<Platforms value="android" />);

    expect(screen.getByRole('radio', { name: 'Android' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'iOS' })).not.toBeChecked();
  });

  it('leaves a disabled group where it is', async () => {
    const onValueChange = vi.fn();

    render(<Platforms disabled onValueChange={onValueChange} />);

    await userEvent.click(screen.getByText('Android'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('tints the chosen ring with the colour it is given', () => {
    render(
      <AkRadioGroup value="on" aria-label="State">
        <AkRadio value="on" aria-label="On" color="success" />
      </AkRadioGroup>
    );

    expect(screen.getByRole('radio', { name: 'On' })).toHaveClass(
      'data-[state=checked]:border-success'
    );
  });
});
