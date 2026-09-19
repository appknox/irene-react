import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkIcon } from '@irene/ui/ak-icon';
import { iconNamesBySet } from '@irene/ui/icons/sets';

const meta = {
  title: 'Components/AkIcon',
  component: AkIcon,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'text' },
  },
  args: { name: 'material-symbols:check', size: '24px' },
} satisfies Meta<typeof AkIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every bundled icon. Adding one to src/icons/sets.ts makes it appear here. */
export const AllIcons: Story = {
  render: () => (
    <div className="max-w-3xl">
      {Object.entries(iconNamesBySet).map(([set, names]) => (
        <section key={set} className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">
            {set} <span className="text-foreground-muted">({names.length})</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {names.map((name) => (
              <span
                key={name}
                title={name}
                className="flex size-8 items-center justify-center rounded-sm border border-border"
              >
                <AkIcon name={name} size="20px" />
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

/** Size follows whatever you give it; the default tracks the text. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {['16px', '20px', '24px', '32px', '48px'].map((size) => (
        <AkIcon key={size} name="material-symbols:security" size={size} />
      ))}
    </div>
  ),
};

/** Colour comes from the text colour, so a parent class tints the icon. */
export const Colours: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-2xl">
      <AkIcon name="material-symbols:error" className="text-danger" />
      <AkIcon name="material-symbols:check-circle" className="text-success" />
      <AkIcon name="material-symbols:info" className="text-info" />
      <AkIcon name="material-symbols:warning" className="text-warning" />
    </div>
  ),
};

export const Default: Story = {};
