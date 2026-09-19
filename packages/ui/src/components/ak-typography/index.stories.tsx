import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkTypography } from '@irene/ui/ak-typography';

const VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'body3',
] as const;

const COLORS = [
  'textPrimary',
  'textSecondary',
  'primary',
  'secondary',
  'success',
  'error',
  'warn',
  'info',
] as const;

const meta = {
  title: 'Components/AkTypography',
  component: AkTypography,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    color: { control: 'select', options: ['inherit', ...COLORS] },
    fontWeight: { control: 'select', options: ['light', 'regular', 'medium', 'bold'] },
    align: { control: 'select', options: ['left', 'center', 'right', 'justify'] },
    underline: { control: 'select', options: ['none', 'always', 'hover'] },
  },
  args: { children: 'The quick brown fox jumps over the lazy dog' },
} satisfies Meta<typeof AkTypography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The full scale. Each variant fixes a size, a weight and the element it renders as. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-baseline gap-4">
          <code className="w-24 shrink-0 text-xs text-foreground-muted">{variant}</code>
          <AkTypography {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {COLORS.map((color) => (
        <AkTypography key={color} {...args} color={color}>
          {color}
        </AkTypography>
      ))}
    </div>
  ),
};

/** Weight, element and size can each be overridden without leaving the variant. */
export const Overrides: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <AkTypography {...args} variant="h5">
        h5 as it comes
      </AkTypography>

      <AkTypography {...args} variant="h5" fontWeight="light">
        h5 with fontWeight=&quot;light&quot;
      </AkTypography>

      <AkTypography {...args} variant="h5" tag="span">
        h5 rendered as a span
      </AkTypography>

      <AkTypography {...args} variant="h5" className="text-xl">
        h5 resized with a class
      </AkTypography>
    </div>
  ),
};

export const Truncated: Story = {
  args: { noWrap: true },
  render: (args) => (
    <div className="w-64 border border-border p-2">
      <AkTypography {...args} />
    </div>
  ),
};
