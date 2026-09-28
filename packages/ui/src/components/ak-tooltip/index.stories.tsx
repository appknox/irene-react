import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';

const meta = {
  title: 'Components/AkTooltip',
  component: AkTooltip,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'inline-radio', options: ['light', 'dark'] },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    arrow: { control: 'boolean' },
    disabled: { control: 'boolean' },
    delayDuration: { control: { type: 'number', min: 0, step: 100 } },
  },
  args: {
    title: 'All projects',
    color: 'dark',
    side: 'top',
    arrow: false,
    disabled: false,
    delayDuration: 0,
    children: <AkButton variant="outlined">Hover me</AkButton>,
  },
} satisfies Meta<typeof AkTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The default: dark, for a label read against the page. */
export const Dark: Story = { args: { color: 'dark' } };

/** Light, for a tooltip over a dark surface. */
export const Light: Story = {
  args: { color: 'light' },
  parameters: { backgrounds: { default: 'dark' } },
};

/** A pointer at the trigger, for a tooltip that could belong to either of two controls. */
export const WithArrow: Story = { args: { arrow: true } };

/** Each side the tooltip can take, which decides where the arrow sits. */
export const Sides: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <AkTooltip key={side} {...args} side={side} title={side} arrow>
          <AkButton variant="outlined">{side}</AkButton>
        </AkTooltip>
      ))}
    </div>
  ),
};

/** Waits before opening, so passing over a row of controls does not flash a label per control. */
export const Delayed: Story = { args: { delayDuration: 600, title: 'Opens after 600ms' } };

/** Disabled renders the trigger alone, for a label that is already on screen. */
export const Disabled: Story = { args: { disabled: true } };

/** An icon-only control, which is where a tooltip carries the only label there is. */
export const OnAnIconControl: Story = {
  args: { title: 'Collapse', arrow: true, side: 'right' },
  render: (args) => (
    <AkTooltip {...args}>
      <AkButton variant="text" aria-label="Collapse">
        <AkIcon name="material-symbols:keyboard-tab" className="size-5" />
      </AkButton>
    </AkTooltip>
  ),
};

/** Long text wraps and balances rather than running off the edge. */
export const LongTitle: Story = {
  args: {
    title: 'Every project this organization holds, including the ones you are not a member of',
    arrow: true,
  },
};
