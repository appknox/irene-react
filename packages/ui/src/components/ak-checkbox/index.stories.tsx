import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkLabel } from '@irene/ui/ak-label';

const meta = {
  title: 'Components/AkCheckbox',
  component: AkCheckbox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    color: {
      control: 'select',
      options: ['primary', 'neutral', 'error', 'success', 'warning', 'info'],
    },
  },
  args: { checked: false, disabled: false, color: 'primary' },
} satisfies Meta<typeof AkCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every state, side by side: empty, ticked, part-ticked, disabled and invalid. */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AkCheckbox checked={false} />
      <AkCheckbox checked />
      <AkCheckbox checked="indeterminate" />
      <AkCheckbox disabled />
      <AkCheckbox checked disabled />
      <AkCheckbox aria-invalid />
    </div>
  ),
};

/** The colours a ticked box takes. An empty box is the same in all of them. */
export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AkCheckbox checked color="primary" />
      <AkCheckbox checked color="neutral" />
      <AkCheckbox checked color="error" />
      <AkCheckbox checked color="success" />
      <AkCheckbox checked color="warning" />
      <AkCheckbox checked color="info" />
    </div>
  ),
};

/** Stands for a group whose members disagree, which a screen reader reads as mixed. */
export const Indeterminate: Story = {
  args: { checked: 'indeterminate' },
  render: (args) => <AkCheckbox {...args} />,
};

/** A box wired to its own state, as a form would wire it. */
function TermsCheckbox() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <AkCheckbox
        id="terms"
        checked={accepted}
        onCheckedChange={(next) => setAccepted(next === true)}
      />

      <AkLabel htmlFor="terms">I accept the terms and conditions</AkLabel>
    </div>
  );
}

/** Beside the label it belongs to, which ticks the box when clicked. */
export const WithLabel: Story = { render: () => <TermsCheckbox /> };
