import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

const meta = {
  title: 'Components/AkInput',
  component: AkInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'email',
        'password',
        'search',
        'number',
        'tel',
        'url',
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
        'color',
        'file',
      ],
    },
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

/** The input types the app uses, to check padding and the native controls each one adds. */
export const AllTypes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <AkInput type="text" placeholder="Text" />
      <AkInput type="email" placeholder="you@appknox.com" />
      <AkInput type="password" defaultValue="secret" />
      <AkInput type="search" placeholder="Search projects" />
      <AkInput type="number" placeholder="42" />
      <AkInput type="tel" placeholder="+1 555 0100" />
      <AkInput type="url" placeholder="https://appknox.com" />
      <AkInput type="date" />
      <AkInput type="time" />
      <AkInput type="datetime-local" />
      <AkInput type="month" />
      <AkInput type="week" />
      <AkInput type="color" defaultValue="#ff4d3f" />
      <AkInput type="file" />
    </div>
  ),
};

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = { args: { 'aria-invalid': true } };

export const Password: Story = { args: { type: 'password', defaultValue: 'secret' } };
