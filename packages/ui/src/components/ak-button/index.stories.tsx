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

const COLORS = [
  'primary',
  'neutral',
  'error',
  'success',
  'warning',
  'info',
  'textPrimary',
  'textSecondary',
] as const;

/** Every variant and color side by side, to catch one drifting from the others. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['filled', 'outlined', 'text'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {COLORS.map((color) => (
            <AkButton key={color} variant={variant} color={color}>
              {color}
            </AkButton>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Loading, disabled and idle for every variant, since all three can load. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['filled', 'outlined', 'text'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          <AkButton variant={variant}>{variant}</AkButton>

          <AkButton variant={variant} loading>
            {variant} loading
          </AkButton>

          <AkButton variant={variant} disabled>
            {variant} disabled
          </AkButton>
        </div>
      ))}
    </div>
  ),
};

/** Loading in every colour, to check the spinner against each background. */
export const LoadingColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['filled', 'outlined', 'text'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {COLORS.map((color) => (
            <AkButton key={color} variant={variant} color={color} loading>
              {color}
            </AkButton>
          ))}
        </div>
      ))}
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
