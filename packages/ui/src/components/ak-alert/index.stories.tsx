import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkAlert, AkAlertDescription, AkAlertTitle } from '@irene/ui/ak-alert';
import { AkIcon } from '@irene/ui/ak-icon';

const meta = {
  title: 'Components/AkAlert',
  component: AkAlert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive'] },
  },
} satisfies Meta<typeof AkAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both variants side by side, to catch one drifting from the other. */
/** With a close button, shown whenever an onDismiss is passed. */
export const Dismissible: Story = {
  render: () => (
    <AkAlert variant="error" className="w-96" onDismiss={() => {}}>
      <AkAlertTitle>Unable to reach the server</AkAlertTitle>
      <AkAlertDescription>Check your connection and try again.</AkAlertDescription>
    </AkAlert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <AkAlert>
        <AkIcon name="material-symbols:info" />
        <AkAlertTitle>Scan queued</AkAlertTitle>
        <AkAlertDescription>The build is in the queue and will start shortly.</AkAlertDescription>
      </AkAlert>

      <AkAlert variant="error">
        <AkIcon name="material-symbols:error" />
        <AkAlertTitle>Scan failed</AkAlertTitle>
        <AkAlertDescription>The binary could not be read. Upload it again.</AkAlertDescription>
      </AkAlert>
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    <AkAlert className="w-96">
      <AkAlertTitle>Scan queued</AkAlertTitle>
      <AkAlertDescription>The build will start shortly.</AkAlertDescription>
    </AkAlert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <AkAlert variant="error" className="w-96">
      <AkAlertTitle>Scan failed</AkAlertTitle>
      <AkAlertDescription>The binary could not be read.</AkAlertDescription>
    </AkAlert>
  ),
};

/** A title alone, for a short statement that needs no elaboration. */
export const TitleOnly: Story = {
  render: () => (
    <AkAlert className="w-96">
      <AkAlertTitle>Scan queued</AkAlertTitle>
    </AkAlert>
  ),
};
