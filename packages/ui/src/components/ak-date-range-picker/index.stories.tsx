import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkDateRangePicker, type AkDateRange } from '@irene/ui/ak-date-range-picker';
import { akDateRangeShortcuts, endOfToday } from '@irene/ui/ak-date-range-picker/helpers';

/** The ranges the picker offers in a click, named as a page would name them. */
const SHORTCUTS = akDateRangeShortcuts({
  yearToDate: 'Year to date',
  last3Months: 'Last 3 months',
  last6Months: 'Last 6 months',
  lastYear: 'Last year',
});

/* The picker holds no range of its own, so the stories keep one for it. */
function PickerWithRange({
  initial = [null, null],
  ...props
}: ComponentProps<typeof AkDateRangePicker> & { initial?: AkDateRange }) {
  const [range, setRange] = useState<AkDateRange>(initial);

  return <AkDateRangePicker {...props} value={range} onChange={setRange} />;
}

const meta = {
  title: 'Components/AkDateRangePicker',
  component: PickerWithRange,
  tags: ['autodocs'],
  args: {
    value: [null, null] as AkDateRange,
    onChange: () => undefined,
    shortcuts: SHORTCUTS,
    fromLabel: 'From',
    toLabel: 'To',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    daysLabel: 'Days',
    formatDate: (date: Date) => date.toDateString(),
  },
} satisfies Meta<typeof PickerWithRange>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ShowingARange: Story = {
  name: 'Showing a range',
  args: { initial: [new Date(2026, 0, 1), endOfToday()] },
};

export const WithoutShortcuts: Story = {
  name: 'Without shortcuts',
  args: { shortcuts: [] },
};

export const NoFutureDays: Story = {
  name: 'No future days',
  args: { maxDate: endOfToday() },
};
