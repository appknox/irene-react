import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { StorySection } from '@irene/ui/story-layout';

const COLORS = ['default', 'primary', 'secondary', 'success', 'error', 'warn', 'info'] as const;
const VARIANTS = ['filled', 'semi-filled', 'outlined', 'semi-filled-outlined'] as const;

const meta = {
  title: 'Components/AkChip',
  component: AkChip,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    button: { control: 'boolean' },
    fontWeight: { control: 'inline-radio', options: ['light', 'regular', 'medium', 'bold'] },
    labelVariant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'subtitle1', 'subtitle2'],
    },
    labelClassName: { control: 'text' },
    labelColor: {
      control: 'select',
      options: ['inherit', 'textPrimary', 'textSecondary', 'primary', 'success', 'error'],
    },
    color: { control: 'select', options: COLORS },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
  },
  args: { label: 'Critical', variant: 'outlined', color: 'default', size: 'medium' },
} satisfies Meta<typeof AkChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every variant, each in all seven colours. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant} className="flex-row flex-wrap">
          {COLORS.map((color) => (
            <AkChip key={color} {...args} variant={variant} color={color} label={color} />
          ))}
        </StorySection>
      ))}
    </div>
  ),
};

/** Both heights: 32px beside a heading, 22px beside body text. The icon follows each. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {(['medium', 'small'] as const).map((size) => (
        <StorySection key={size} title={size} className="flex-row flex-wrap">
          <AkChip {...args} size={size} label={size} />

          <AkChip
            {...args}
            size={size}
            label={size}
            icon={<AkIcon name="material-symbols:check" />}
          />

          <AkChip
            {...args}
            size={size}
            label={size}
            icon={<AkIcon name="material-symbols:check" />}
            onDelete={() => undefined}
          />
        </StorySection>
      ))}
    </div>
  ),
};

/** A dismiss control, for a chip standing for a filter the user can drop. */
export const Dismissible: Story = {
  args: { label: 'Severity: critical', onDelete: () => undefined },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {(['medium', 'small'] as const).map((size) => (
        <StorySection key={size} title={size} className="flex-row flex-wrap">
          {VARIANTS.map((variant) => (
            <AkChip key={variant} {...args} size={size} variant={variant} label={variant} />
          ))}
        </StorySection>
      ))}
    </div>
  ),
};

/** A chip that acts on a click reads as a control, and can carry a dismiss beside it. */
export const Interactive: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="As a button" className="flex-row">
        <AkChip {...args} button color="primary" label="Filter by critical" />
      </StorySection>

      <StorySection title="A button that can also be dropped" className="flex-row">
        <AkChip
          {...args}
          button
          variant="semi-filled-outlined"
          color="info"
          label="Android"
          onDelete={() => undefined}
        />
      </StorySection>
    </div>
  ),
};

/** What the label can be set in: a weight, a step of the type scale, a colour, or classes. */
export const Label: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="Weight" className="flex-row flex-wrap">
        {(['light', 'regular', 'medium', 'bold'] as const).map((fontWeight) => (
          <AkChip key={fontWeight} {...args} fontWeight={fontWeight} label={fontWeight} />
        ))}
      </StorySection>

      <StorySection title="A step of the type scale" className="flex-row flex-wrap">
        {(['body2', 'body1', 'subtitle1', 'h6'] as const).map((labelVariant) => (
          <AkChip key={labelVariant} {...args} labelVariant={labelVariant} label={labelVariant} />
        ))}
      </StorySection>

      <StorySection
        title="Colour, which follows the chip's unless one is named"
        className="flex-row flex-wrap"
      >
        {(['inherit', 'textSecondary', 'primary', 'success', 'error'] as const).map(
          (labelColor) => (
            <AkChip key={labelColor} {...args} labelColor={labelColor} label={labelColor} />
          )
        )}
      </StorySection>

      <StorySection
        title="Classes, which win over both the chip's size and a named step"
        className="flex-row flex-wrap"
      >
        <AkChip {...args} label="the chip's size" />

        <AkChip {...args} labelClassName="text-xs" label="over the size" />

        <AkChip {...args} labelVariant="h6" labelClassName="text-xs" label="over the variant" />
      </StorySection>
    </div>
  ),
};

/** Where the app uses it: a state with an icon, and a count beside a navigation item. */
export const InUse: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <AkChip
        {...args}
        color="success"
        label="Passed"
        icon={<AkIcon name="material-symbols:check" className="size-3.5" />}
      />

      <AkChip
        {...args}
        size="small"
        label="12"
        className="h-4.5 bg-divider-strong text-foreground/40"
      />
    </div>
  ),
};
