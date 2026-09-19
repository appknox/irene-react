import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkDivider } from '@irene/ui/ak-divider';

const meta = {
  title: 'Components/AkDivider',
  component: AkDivider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    color: { control: 'inline-radio', options: ['light', 'dark'] },
    variant: { control: 'inline-radio', options: ['fullWidth', 'middle'] },
  },
} satisfies Meta<typeof AkDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AkDivider />
      <AkDivider color="dark" />
    </div>
  ),
};

/** Upright, for separating things side by side. */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4">
      <span>Before</span>
      <AkDivider direction="vertical" color="dark" />
      <span>After</span>
    </div>
  ),
};

/** How the login page splits the password form from the SSO button. */
export const BesideText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <AkDivider className="flex-1" />
      <span>or</span>
      <AkDivider className="flex-1" />
    </div>
  ),
};
