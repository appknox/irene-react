import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';
import { AkTypography } from '@irene/ui/ak-typography';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
];

const meta = {
  title: 'Components/AkRadio',
  component: AkRadioGroup,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
  args: { disabled: false, defaultValue: 'all', 'aria-label': 'Platform' },
  render: (args) => (
    <AkRadioGroup {...args} className="gap-2">
      {OPTIONS.map((option) => (
        <label key={option.value} className="flex items-center gap-2">
          <AkRadio value={option.value} />

          <AkTypography tag="span">{option.label}</AkTypography>
        </label>
      ))}
    </AkRadioGroup>
  ),
} satisfies Meta<typeof AkRadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Controlled: Story = {
  render: function ControlledRadio(args) {
    const [value, setValue] = useState('android');

    return (
      <div className="flex flex-col gap-3">
        <AkRadioGroup {...args} value={value} onValueChange={setValue} className="gap-2">
          {OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <AkRadio value={option.value} />

              <AkTypography tag="span">{option.label}</AkTypography>
            </label>
          ))}
        </AkRadioGroup>

        <AkTypography variant="body2" color="neutral">
          Chosen: {value}
        </AkTypography>
      </div>
    );
  },
};
