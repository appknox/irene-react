import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkLabel } from '@irene/ui/ak-label';
import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';

const meta = {
  title: 'Components/AkRadio',
  component: AkRadio,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: ['primary', 'neutral'] },
    disabled: { control: 'boolean' },
  },
  /* `value` is required of a button; each choice below sets its own over this one. */
  args: { color: 'primary', disabled: false, value: 'cloud' },
} satisfies Meta<typeof AkRadio>;

export default meta;

type Story = StoryObj<typeof meta>;

const CHOICES = [
  { id: 'cloud', label: 'Jira Cloud' },
  { id: 'data-center', label: 'Jira Data Center' },
  { id: 'security', label: 'Jira Security' },
];

/** The three ways an organization can connect to Jira, which is what irene asks here. */
function JiraTypeChoices(args: ComponentProps<typeof AkRadio>) {
  const [value, setValue] = useState('cloud');

  return (
    <AkRadioGroup value={value} onValueChange={setValue}>
      {CHOICES.map((choice) => (
        <div key={choice.id} className="flex items-center gap-1">
          <AkRadio {...args} id={choice.id} value={choice.id} />

          <AkLabel htmlFor={choice.id}>{choice.label}</AkLabel>
        </div>
      ))}
    </AkRadioGroup>
  );
}

export const Group: Story = { render: (args) => <JiraTypeChoices {...args} /> };
