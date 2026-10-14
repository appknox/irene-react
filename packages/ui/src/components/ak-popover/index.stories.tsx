import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AkPopover,
  AkPopoverClose,
  AkPopoverContent,
  AkPopoverTrigger,
} from '@irene/ui/ak-popover';

import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

const meta = {
  title: 'Components/AkPopover',
  component: AkPopoverContent,
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    arrow: { control: 'boolean' },
    sideOffset: { control: { type: 'number', min: 0, step: 2 } },
  },
  args: { side: 'bottom', align: 'start', arrow: false, sideOffset: 8 },
} satisfies Meta<typeof AkPopoverContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <AkPopover>
      <AkPopoverTrigger asChild>
        <AkButton variant="outlined">Open</AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent {...args}>
        <AkTypography variant="body2">A panel anchored to the control that opened it.</AkTypography>
      </AkPopoverContent>
    </AkPopover>
  ),
};

/** A pointer at the trigger, for a panel that could belong to more than one control. */
export const WithArrow: Story = {
  args: { arrow: true },
  render: Playground.render,
};

/** Each side the panel can open on. */
export const Sides: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <AkPopover key={side}>
          <AkPopoverTrigger asChild>
            <AkButton>{side}</AkButton>
          </AkPopoverTrigger>

          <AkPopoverContent {...args} side={side} arrow>
            <AkTypography variant="body2">Opens on the {side}</AkTypography>
          </AkPopoverContent>
        </AkPopover>
      ))}
    </div>
  ),
};

/** How the panel lines up along the trigger's edge. */
export const Alignments: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(['start', 'center', 'end'] as const).map((align) => (
        <AkPopover key={align}>
          <AkPopoverTrigger asChild>
            <AkButton>{align}</AkButton>
          </AkPopoverTrigger>

          <AkPopoverContent {...args} align={align}>
            <AkTypography variant="body2">Aligned to {align}</AkTypography>
          </AkPopoverContent>
        </AkPopover>
      ))}
    </div>
  ),
};

/** Modal traps focus and covers the page behind, for a panel to finish with before going on. */
export const Modal: Story = {
  render: (args) => (
    <AkPopover modal>
      <AkPopoverTrigger asChild>
        <AkButton variant="outlined">Open</AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent {...args}>
        <AkTypography variant="body2">
          Nothing behind this panel takes a click until it is closed.
        </AkTypography>
      </AkPopoverContent>
    </AkPopover>
  ),
};

/** A menu of links, the shape the product switcher takes. */
export const AsAMenu: Story = {
  render: (args) => (
    <AkPopover>
      <AkPopoverTrigger asChild>
        <AkButton variant="outlined">Switch to</AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent {...args} side="right" arrow className="w-50 p-0">
        <AkTypography
          tag="h2"
          fontWeight="bold"
          className="border-b border-border bg-divider p-3.5 text-sm uppercase"
        >
          Switch to
        </AkTypography>

        {['Appknox', 'StoreKnox', 'Reporting'].map((product) => (
          <a
            key={product}
            href="#top"
            className={cn(
              'flex items-center border-t border-divider px-3.5 py-2.75',
              'hover:bg-hover-light'
            )}
          >
            <AkTypography variant="body2">{product}</AkTypography>
          </a>
        ))}
      </AkPopoverContent>
    </AkPopover>
  ),
};

/** Controls inside it take focus, and either of these closes the panel. */
export const WithControls: Story = {
  render: (args) => (
    <AkPopover>
      <AkPopoverTrigger asChild>
        <AkButton variant="outlined">Discard changes</AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent {...args} arrow>
        <div className="flex flex-col gap-3">
          <AkTypography variant="body2">Discard the changes on this page?</AkTypography>

          <AkDivider />

          <div className="flex justify-end gap-2">
            <AkPopoverClose asChild>
              <AkButton variant="outlined" color="neutral" size="sm">
                Cancel
              </AkButton>
            </AkPopoverClose>

            <AkPopoverClose asChild>
              <AkButton color="error" size="sm">
                Discard
              </AkButton>
            </AkPopoverClose>
          </div>
        </div>
      </AkPopoverContent>
    </AkPopover>
  ),
};
