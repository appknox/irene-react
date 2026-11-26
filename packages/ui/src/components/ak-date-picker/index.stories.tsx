import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkButton } from '@irene/ui/ak-button';
import { AkDatePicker } from '@irene/ui/ak-date-picker';
import type { AkDateRange } from '@irene/ui/ak-date-picker/helpers';

const meta = {
  title: 'Components/AkDatePicker',
  component: AkDatePicker,
  tags: ['autodocs'],
} satisfies Meta<typeof AkDatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** What the control reads once a span has been chosen. */
const writeSpan = ({ start, end }: AkDateRange) =>
  start === null ? 'Pick a span' : `${start.toDateString()} — ${end?.toDateString() ?? '…'}`;

/** A span chosen on the calendar, with nothing offered outright. */
function PlainPicker() {
  const [span, setSpan] = useState<AkDateRange>({ start: null, end: null });

  return (
    <AkDatePicker selected={span} onSelect={setSpan}>
      <AkButton variant="outlined">{writeSpan(span)}</AkButton>
    </AkDatePicker>
  );
}

/** The same, with the spans the organization's exports offer. */
function PickerWithQuickSelects() {
  const [span, setSpan] = useState<AkDateRange>({ start: null, end: null });

  return (
    <AkDatePicker
      selected={span}
      onSelect={setSpan}
      maxDate={new Date()}
      quickSelectOptions={['last7Days', 'last30Days', 'last3Months', 'last6Months', 'lastYear']}
    >
      <AkButton variant="outlined">{writeSpan(span)}</AkButton>
    </AkDatePicker>
  );
}

export const Default: Story = {
  args: { selected: { start: null, end: null }, onSelect: () => undefined, children: null },

  render: () => <PlainPicker />,
};

export const WithQuickSelects: Story = {
  args: { selected: { start: null, end: null }, onSelect: () => undefined, children: null },

  render: () => <PickerWithQuickSelects />,
};
