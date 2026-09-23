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
  args: { direction: 'horizontal', color: 'dark', variant: 'fullWidth' },
} satisfies Meta<typeof AkDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

/*
  A vertical divider is `h-full`, so it measures nothing in a container with no
  height of its own. The wrapper gives it one, and lays the content out along
  the axis the divider cuts across.
*/
export const Playground: Story = {
  render: (args) =>
    args.direction === 'vertical' ? (
      <div className="flex h-24 items-center gap-4">
        <span>Before</span>
        <AkDivider {...args} />
        <span>After</span>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <span>Above</span>
        <AkDivider {...args} />
        <span>Below</span>
      </div>
    ),
};

/** `color`: dark is the default rule, light is the faint one. */
export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">color=&quot;dark&quot; (default)</span>
        <AkDivider color="dark" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">color=&quot;light&quot;</span>
        <AkDivider color="light" />
      </div>
    </div>
  ),
};

/** `variant`: fullWidth runs edge to edge, middle insets itself by 16px. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 bg-neutral-100 py-2">
        <span className="px-2 text-sm text-foreground-muted">variant=&quot;fullWidth&quot;</span>
        <AkDivider variant="fullWidth" />
      </div>

      <div className="flex flex-col gap-2 bg-neutral-100 py-2">
        <span className="px-2 text-sm text-foreground-muted">variant=&quot;middle&quot;</span>
        <AkDivider variant="middle" />
      </div>
    </div>
  ),
};

/** `direction`: horizontal renders an `hr`, vertical a `div` with a left border. */
export const Directions: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">direction=&quot;horizontal&quot;</span>
        <AkDivider direction="horizontal" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">direction=&quot;vertical&quot;</span>

        <div className="flex h-12 items-center gap-4">
          <span>Before</span>
          <AkDivider direction="vertical" />
          <span>After</span>
        </div>
      </div>
    </div>
  ),
};

/** Every combination of direction, color and variant. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['dark', 'light'] as const).map((color) =>
        (['fullWidth', 'middle'] as const).map((variant) => (
          <div key={`${color}-${variant}`} className="flex flex-col gap-2 bg-neutral-100 py-2">
            <span className="px-2 text-sm text-foreground-muted">
              color={color} · variant={variant}
            </span>

            <AkDivider color={color} variant={variant} />

            <div className="flex h-10 items-center gap-4 px-2">
              <span>Before</span>
              <AkDivider direction="vertical" color={color} variant={variant} />
              <span>After</span>
            </div>
          </div>
        ))
      )}
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
