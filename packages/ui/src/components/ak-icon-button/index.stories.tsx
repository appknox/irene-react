import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { StorySection } from '@irene/ui/story-layout';

const BORDER_COLORS = ['default', 'primary', 'secondary'] as const;

const SIZES = ['small', 'medium'] as const;

const IN_USE_ICONS = [
  'material-symbols:close',
  'material-symbols:refresh',
  'material-symbols:download',
  'material-symbols:more-vert',
  'material-symbols:edit',
  'material-symbols:delete',
] as const;

const meta = {
  title: 'Components/AkIconButton',
  component: AkIconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outlined'] },
    borderColor: { control: 'inline-radio', options: BORDER_COLORS },
    size: { control: 'inline-radio', options: SIZES },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Refresh',
    children: <AkIcon name="material-symbols:refresh" />,
  },
} satisfies Meta<typeof AkIconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Transparent until it is hovered, or drawn with a border of its own. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="default" className="flex-row">
        <AkIconButton {...args} />
      </StorySection>

      <StorySection title="outlined" className="flex-row">
        <AkIconButton {...args} variant="outlined" />
      </StorySection>
    </div>
  ),
};

/** The border an outlined button takes, and the outline it thickens to on hover. */
export const BorderColors: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {BORDER_COLORS.map((borderColor) => (
        <StorySection key={borderColor} title={borderColor} className="flex-row">
          <AkIconButton {...args} variant="outlined" borderColor={borderColor} />
        </StorySection>
      ))}
    </div>
  ),
};

/** The two sizes, in both variants, since the padding and the icon both move. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {SIZES.map((size) => (
        <StorySection key={size} title={size} className="flex-row items-center">
          <AkIconButton {...args} size={size} />

          <AkIconButton {...args} size={size} variant="outlined" />
        </StorySection>
      ))}
    </div>
  ),
};

/** Disabled: the icon greys out, the tint and the pointer go. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="default" className="flex-row">
        <AkIconButton {...args} disabled />
      </StorySection>

      <StorySection title="outlined" className="flex-row">
        <AkIconButton {...args} variant="outlined" disabled />

        <AkIconButton {...args} variant="outlined" borderColor="primary" disabled />
      </StorySection>
    </div>
  ),
};

/** The icons it is used with across the app. */
export const InUse: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {IN_USE_ICONS.map((name) => (
        <AkIconButton {...args} key={name} aria-label={name}>
          <AkIcon name={name} />
        </AkIconButton>
      ))}
    </div>
  ),
};
