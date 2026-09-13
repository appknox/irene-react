import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkLabel } from '@irene/ui/ak-label';
import {
  AkSelect,
  AkSelectContent,
  AkSelectGroup,
  AkSelectItem,
  AkSelectLabel,
  AkSelectSeparator,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

const meta = {
  title: 'Components/AkSelect',
  component: AkSelect,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof AkSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

const Severity = (props: React.ComponentProps<typeof AkSelect>) => (
  <AkSelect {...props}>
    <AkSelectTrigger className="w-56">
      <AkSelectValue placeholder="Any severity" />
    </AkSelectTrigger>
    <AkSelectContent>
      <AkSelectItem value="critical">Critical</AkSelectItem>
      <AkSelectItem value="high">High</AkSelectItem>
      <AkSelectItem value="medium">Medium</AkSelectItem>
      <AkSelectItem value="low">Low</AkSelectItem>
    </AkSelectContent>
  </AkSelect>
);

/** Every state side by side, to catch one drifting from the others. */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Severity />
      <Severity value="high" />
      <Severity disabled />
    </div>
  ),
};

export const Default: Story = { render: () => <Severity /> };

export const WithValue: Story = { render: () => <Severity value="high" /> };

export const Disabled: Story = { render: () => <Severity disabled /> };

/** Grouped options, for a list long enough to need headings. */
export const Grouped: Story = {
  render: () => (
    <AkSelect>
      <AkSelectTrigger className="w-56">
        <AkSelectValue placeholder="Any platform" />
      </AkSelectTrigger>
      <AkSelectContent>
        <AkSelectGroup>
          <AkSelectLabel>Mobile</AkSelectLabel>
          <AkSelectItem value="android">Android</AkSelectItem>
          <AkSelectItem value="ios">iOS</AkSelectItem>
        </AkSelectGroup>
        <AkSelectSeparator />
        <AkSelectGroup>
          <AkSelectLabel>Other</AkSelectLabel>
          <AkSelectItem value="web">Web</AkSelectItem>
        </AkSelectGroup>
      </AkSelectContent>
    </AkSelect>
  ),
};

/** With a label, as it appears in a form. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <AkLabel htmlFor="severity">Severity</AkLabel>
      <Severity />
    </div>
  ),
};
