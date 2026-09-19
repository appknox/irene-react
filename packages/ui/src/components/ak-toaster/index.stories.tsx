import { Fragment } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkButton } from '@irene/ui/ak-button';
import { AkToaster } from '@irene/ui/ak-toaster';
import { akNotify } from '@irene/ui/notify';

const meta = {
  title: 'Components/AkToaster',
  component: AkToaster,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AkToaster>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One button per kind, to compare the icons and colours. */
export const AllKinds: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <AkToaster />

      <AkButton color="success" onClick={() => akNotify.success('ApiProject created')}>
        Success
      </AkButton>

      <AkButton color="info" onClick={() => akNotify.info('Scan queued')}>
        Info
      </AkButton>

      <AkButton color="warning" onClick={() => akNotify.warning('Trial ends in 3 days')}>
        Warning
      </AkButton>

      <AkButton color="error" onClick={() => akNotify.error('Unable to reach the server')}>
        Error
      </AkButton>

      <AkButton variant="outlined" onClick={() => akNotify.dismiss()}>
        Dismiss all
      </AkButton>
    </div>
  ),
};

/** A message with a description under it. */
export const WithDescription: Story = {
  render: () => (
    <Fragment>
      <AkToaster />

      <AkButton
        onClick={() =>
          akNotify.error('Login failed', { description: 'Invalid username or password.' })
        }
      >
        Raise
      </AkButton>
    </Fragment>
  ),
};
