import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { StorySection } from '@irene/ui/story-layout';

const SIZES = ['small', 'default', 'large'] as const;

const meta = {
  title: 'Components/AkToggle',
  component: AkToggle,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    disabled: { control: 'boolean' },
  },
  args: { size: 'default', disabled: false, 'aria-label': 'Email me' },
} satisfies Meta<typeof AkToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Each size, off and on. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {SIZES.map((size) => (
        <StorySection key={size} title={size} className="flex-row items-center">
          <AkToggle {...args} size={size} />

          <AkToggle {...args} size={size} defaultChecked />
        </StorySection>
      ))}
    </div>
  ),
};

/** Disabled, off and on: it keeps its colour, faded. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <AkToggle {...args} disabled />

      <AkToggle {...args} disabled defaultChecked />
    </div>
  ),
};

/** A setting row: the label names the switch, and the state lives with the caller. */
export const WithLabel: Story = {
  render: function WithLabelToggle(args) {
    const [isOn, setIsOn] = useState(true);

    return (
      <label className="flex w-80 items-center justify-between gap-4">
        <AkTypography tag="span">Email me when a scan finishes</AkTypography>

        <AkToggle {...args} aria-label={undefined} checked={isOn} onCheckedChange={setIsOn} />
      </label>
    );
  },
};
