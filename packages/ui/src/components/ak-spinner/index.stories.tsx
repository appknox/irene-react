import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkSpinner } from '@irene/ui/ak-spinner';

const meta = {
  title: 'Components/AkSpinner',
  component: AkSpinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AkSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The sizes it is used at, and how it follows the text colour. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-primary">
      <AkSpinner className="size-3" />
      <AkSpinner />
      <AkSpinner className="size-6" />
      <AkSpinner className="size-8 text-foreground-muted" />
    </div>
  ),
};
