import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkProgressLinear } from '@irene/ui/ak-progress-linear';

const meta = {
  title: 'Components/AkProgressLinear',
  component: AkProgressLinear,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    label: { control: 'text' },
  },
  args: { value: 40, label: 'Loading' },
} satisfies Meta<typeof AkProgressLinear>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** How far along the wait is, from empty to finished. */
export const Progress: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AkProgressLinear value={0} />
      <AkProgressLinear value={35} />
      <AkProgressLinear value={75} />
      <AkProgressLinear value={100} />
    </div>
  ),
};

/** Without a value the bar travels, for a wait whose length nothing knows yet. */
export const Indeterminate: Story = {
  args: { value: undefined },
  render: (args) => <AkProgressLinear {...args} />,
};

/** The track takes any width and height a caller sets. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <AkProgressLinear value={60} className="h-0.5 max-w-40" />
      <AkProgressLinear value={60} className="max-w-70" />
      <AkProgressLinear value={60} className="h-3" />
    </div>
  ),
};

/** The bar as the loading screen drives it, advancing while a page is built. */
function AdvancingBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const advance = setInterval(() => setProgress((step) => (step >= 100 ? 0 : step + 5)), 300);

    return () => clearInterval(advance);
  }, []);

  return <AkProgressLinear value={progress} label="Loading the dashboard" className="max-w-70" />;
}

/** The app's loading screen: the bar advances while the page is being built. */
export const WhileAPageLoads: Story = {
  render: () => <AdvancingBar />,
};
