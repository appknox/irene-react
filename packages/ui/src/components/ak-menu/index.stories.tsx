import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AkMenu,
  AkMenuContent,
  AkMenuItem,
  AkMenuSeparator,
  AkMenuTrigger,
} from '@irene/ui/ak-menu';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { StorySection } from '@irene/ui/story-layout';

const meta = {
  title: 'Components/AkMenu',
  component: AkMenuContent,
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    arrow: { control: 'boolean' },
    sideOffset: { control: { type: 'number', min: 0, step: 2 } },
  },
  args: { align: 'end', side: 'bottom', arrow: false, sideOffset: 6 },
} satisfies Meta<typeof AkMenuContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The account menu the top bar opens: who is signed in, then what they can do. */
export const Playground: Story = {
  render: (args) => (
    <AkMenu>
      <AkMenuTrigger asChild>
        <AkButton
          variant="text"
          leftIcon={<AkIcon name="material-symbols:account-circle" />}
          rightIcon={<AkIcon name="material-symbols:arrow-drop-down" />}
        >
          ada
        </AkButton>
      </AkMenuTrigger>

      <AkMenuContent {...args}>
        <AkMenuItem>
          <AkIcon name="material-symbols:account-circle" />
          ada
        </AkMenuItem>

        <AkMenuItem>
          <AkIcon name="material-symbols:mail" />
          ada@appknox.com
        </AkMenuItem>

        <AkMenuSeparator />

        <AkMenuItem color="primary" onSelect={() => undefined}>
          <AkIcon name="material-symbols:logout" />
          Logout
        </AkMenuItem>
      </AkMenuContent>
    </AkMenu>
  ),
};

/** An item that acts takes a pointer and closes the menu; one that states something does not. */
export const ItemKinds: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="Acting, stating, and unavailable" className="flex-row">
        <AkMenu>
          <AkMenuTrigger asChild>
            <AkButton variant="outlined">Open</AkButton>
          </AkMenuTrigger>

          <AkMenuContent {...args}>
            <AkMenuItem>States something</AkMenuItem>

            <AkMenuItem onSelect={() => undefined}>Acts on a click</AkMenuItem>

            <AkMenuItem disabled onSelect={() => undefined}>
              Unavailable
            </AkMenuItem>

            <AkMenuSeparator />

            <AkMenuItem color="primary" onSelect={() => undefined}>
              Stands apart
            </AkMenuItem>
          </AkMenuContent>
        </AkMenu>
      </StorySection>
    </div>
  ),
};

/** Where it opens against its trigger. */
export const Alignments: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(['start', 'center', 'end'] as const).map((align) => (
        <AkMenu key={align}>
          <AkMenuTrigger asChild>
            <AkButton variant="outlined">{align}</AkButton>
          </AkMenuTrigger>

          <AkMenuContent {...args} align={align}>
            <AkMenuItem onSelect={() => undefined}>Aligned to {align}</AkMenuItem>
          </AkMenuContent>
        </AkMenu>
      ))}
    </div>
  ),
};
