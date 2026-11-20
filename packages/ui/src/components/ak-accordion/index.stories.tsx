import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkAccordion } from '@irene/ui/ak-accordion';
import { AkTypography } from '@irene/ui/ak-typography';

const meta = {
  title: 'Components/AkAccordion',
  component: AkAccordion,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'light'] },
    disabled: { control: 'boolean' },
  },
  args: {
    summaryText: 'Store monitoring overview',
    variant: 'primary',
    disabled: false,
    children: (
      <AkTypography className="p-4">
        The last scanned version and when it was monitored.
      </AkTypography>
    ),
  },
} satisfies Meta<typeof AkAccordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Light: Story = {
  args: { variant: 'light', defaultExpanded: true },
};
