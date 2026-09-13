import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

const meta = {
  title: 'Components/AkInput',
  component: AkInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'file'] },
    disabled: { control: 'boolean' },
  },
  args: { placeholder: 'Project name' },
} satisfies Meta<typeof AkInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every state side by side, to catch one drifting from the others. */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <AkInput placeholder="Default" />
      <AkInput placeholder="With a value" defaultValue="irene" />
      <AkInput placeholder="Disabled" disabled />
      <AkInput placeholder="Invalid" aria-invalid />
      <AkInput type="password" defaultValue="secret" />
    </div>
  ),
};

/** The pairing every form uses: a label that focuses its control. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <AkLabel htmlFor="project">Project name</AkLabel>
      <AkInput id="project" placeholder="Acme Mobile" />
    </div>
  ),
};

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = { args: { 'aria-invalid': true } };

export const Password: Story = { args: { type: 'password', defaultValue: 'secret' } };
