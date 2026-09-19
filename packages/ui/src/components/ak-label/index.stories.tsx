import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

const meta = {
  title: 'Components/AkLabel',
  component: AkLabel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'ApiProject name' },
} satisfies Meta<typeof AkLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clicking the label focuses the input — the reason to use it over a div. */
export const WithControl: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <AkLabel htmlFor="project">ApiProject name</AkLabel>
      <AkInput id="project" placeholder="Acme Mobile" />
    </div>
  ),
};

export const Default: Story = {};
