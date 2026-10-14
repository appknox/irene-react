import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { StorySection } from '@irene/ui/story-layout';

const COLORS = ['default', 'light', 'dark'] as const;

const meta = {
  title: 'Components/AkAppbar',
  component: AkAppbar,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'inline-radio', options: COLORS },
    position: {
      control: 'select',
      options: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    },
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    gutter: { control: 'boolean' },
    elevation: { control: 'boolean' },
  },
  args: { color: 'default', position: 'static', placement: 'top', gutter: true },
} satisfies Meta<typeof AkAppbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** What the dashboard puts in it: the page's own controls, then the account's. */
export const Playground: Story = {
  render: (args) => (
    <AkAppbar {...args} className="w-full">
      <div className="flex w-full items-center justify-between">
        <AkTypography variant="body2">Start a new scan</AkTypography>

        <div className="flex items-center gap-2">
          <AkButton variant="text" leftIcon={<AkIcon name="material-symbols:notifications" />}>
            Notifications
          </AkButton>

          <AkButton variant="text" leftIcon={<AkIcon name="material-symbols:account-circle" />}>
            ada@appknox.com
          </AkButton>
        </div>
      </div>
    </AkAppbar>
  ),
};

/** The three surfaces it is drawn on. */
export const Colors: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      {COLORS.map((color) => (
        <StorySection key={color} title={color}>
          <AkAppbar {...args} color={color}>
            <AkTypography variant="body2" color="inherit">
              Appknox
            </AkTypography>
          </AkAppbar>
        </StorySection>
      ))}
    </div>
  ),
};

/** Elevation lifts the bar off a page that scrolls under it. */
export const Elevation: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="Flat">
        <AkAppbar {...args}>
          <AkTypography variant="body2">Appknox</AkTypography>
        </AkAppbar>
      </StorySection>

      <StorySection title="Elevated">
        <AkAppbar {...args} elevation>
          <AkTypography variant="body2">Appknox</AkTypography>
        </AkAppbar>
      </StorySection>
    </div>
  ),
};

/** Without its gutter, the caller lays out its own padding. */
export const WithoutGutter: Story = {
  args: { gutter: false },
  render: (args) => (
    <AkAppbar {...args}>
      <AkTypography variant="body2">Flush against the bar's edges</AkTypography>
    </AkAppbar>
  ),
};
