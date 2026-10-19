import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkSpinner } from '@irene/ui/ak-spinner';

const meta = {
  title: 'Components/AkSpinner',
  component: AkSpinner,
  tags: ['autodocs'],
} satisfies Meta<typeof AkSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The sizes it is used at. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AkSpinner className="size-3" />

      <AkSpinner />

      <AkSpinner className="size-6" />

      <AkSpinner className="size-8" />
    </div>
  ),
};

/** Every colour it spins in. */
export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AkSpinner className="size-6" />

      <AkSpinner color="secondary" className="size-6" />

      <AkSpinner color="neutral" className="size-6" />

      <AkSpinner color="success" className="size-6" />

      <AkSpinner color="error" className="size-6" />

      <AkSpinner color="warn" className="size-6" />

      <AkSpinner color="info" className="size-6" />
    </div>
  ),
};

/** `inherit` takes the colour of whatever surrounds it, as a button's does. */
export const Inherited: Story = {
  render: () => (
    <div className="flex items-center gap-4 rounded-sm bg-primary px-4 py-2 text-white">
      <AkSpinner color="inherit" className="size-6" />

      <span>Uploading</span>
    </div>
  ),
};
