import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { StorySection } from '@irene/ui/story-layout';

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

const VARIANTS = ['filled', 'outlined', 'text'] as const;

const meta = {
  title: 'Components/AkButton',
  component: AkButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['filled', 'outlined', 'text'] },
    color: { control: 'select', options: COLORS },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Start scan' },
} satisfies Meta<typeof AkButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every variant and color side by side, to catch one drifting from the others. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
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
      {VARIANTS.map((variant) => (
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
      {VARIANTS.map((variant) => (
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

/** An icon before the label, after it, or on both sides. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant} className="flex-row flex-wrap">
          <AkButton variant={variant} leftIcon={<AkIcon name="material-symbols:add" />}>
            New project
          </AkButton>

          <AkButton variant={variant} rightIcon={<AkIcon name="material-symbols:arrow-forward" />}>
            Continue
          </AkButton>

          <AkButton
            variant={variant}
            leftIcon={<AkIcon name="material-symbols:download" />}
            rightIcon={<AkIcon name="material-symbols:expand-more" />}
          >
            Download report
          </AkButton>
        </StorySection>
      ))}
    </div>
  ),
};

/** The icon alone, at every size the scale carries. */
export const IconOnly: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant} className="flex-row flex-wrap">
          {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((size) => (
            <AkButton key={size} variant={variant} size={size} aria-label="Refresh">
              <AkIcon name="material-symbols:refresh" />
            </AkButton>
          ))}
        </StorySection>
      ))}
    </div>
  ),
};

/** Loading stands in for the left icon; the right one stays where it is. */
export const LoadingWithIcons: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant} className="flex-row flex-wrap">
          <AkButton
            variant={variant}
            leftIcon={<AkIcon name="material-symbols:play-arrow" />}
            rightIcon={<AkIcon name="material-symbols:arrow-forward" />}
          >
            Start scan
          </AkButton>

          <AkButton
            variant={variant}
            loading
            leftIcon={<AkIcon name="material-symbols:play-arrow" />}
            rightIcon={<AkIcon name="material-symbols:arrow-forward" />}
          >
            Start scan
          </AkButton>
        </StorySection>
      ))}
    </div>
  ),
};

export const Default: Story = {};
