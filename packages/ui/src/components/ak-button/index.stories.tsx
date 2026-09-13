import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkButton } from '.';

const meta = {
  title: 'Components/AkButton',
  component: AkButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Start scan' },
} satisfies Meta<typeof AkButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every variant side by side, to catch one drifting from the others. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <AkButton>Default</AkButton>
      <AkButton variant="destructive">Destructive</AkButton>
      <AkButton variant="outline">Outline</AkButton>
      <AkButton variant="secondary">Secondary</AkButton>
      <AkButton variant="ghost">Ghost</AkButton>
      <AkButton variant="link">Link</AkButton>
    </div>
  ),
};

/** The size scale, which is where the 14px root shows up most. */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <AkButton size="xs">Extra small</AkButton>
      <AkButton size="sm">Small</AkButton>
      <AkButton size="default">Default</AkButton>
      <AkButton size="lg">Large</AkButton>
    </div>
  ),
};

export const Default: Story = {};

export const Destructive: Story = { args: { variant: 'destructive' } };

export const Outline: Story = { args: { variant: 'outline' } };

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Ghost: Story = { args: { variant: 'ghost' } };

export const Link: Story = { args: { variant: 'link' } };

export const Disabled: Story = { args: { disabled: true } };
