import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkChart, type AkChartOption } from '@irene/ui/ak-chart';
import { getCSSVariableValue } from '@irene/ui/css-variable';

const meta = {
  title: 'Components/AkChart',
  component: AkChart,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Scans each month',
  },
} satisfies Meta<typeof AkChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* A canvas resolves no CSS variable, so the option states the colours it draws in. */
const colours = () => ({
  primary: getCSSVariableValue('--color-primary', '#ff4d3f'),
  info: getCSSVariableValue('--color-info', '#087edb'),
  muted: getCSSVariableValue('--color-foreground-muted', '#7b7b7b'),
  divider: getCSSVariableValue('--color-divider', '#f5f5f5'),
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/** A column per month, as the simplest thing the chart draws. */
const columns = (): AkChartOption => {
  const { primary, muted, divider } = colours();

  return {
    textStyle: { color: muted },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: divider } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: divider } } },
    series: [{ type: 'bar', data: [120, 200, 150, 80, 170, 210], itemStyle: { color: primary } }],
  };
};

/** Two series over the same months, which is what a legend is for. */
const twoSeries = (): AkChartOption => {
  const { primary, info, muted, divider } = colours();

  return {
    textStyle: { color: muted },
    legend: { data: ['Android', 'iOS'], textStyle: { color: muted } },
    grid: { left: 40, right: 16, top: 48, bottom: 24 },
    xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: divider } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: divider } } },
    series: [
      { name: 'Android', type: 'line', data: [120, 200, 150, 80, 170, 210], color: primary },
      { name: 'iOS', type: 'line', data: [60, 90, 70, 110, 90, 130], color: info },
    ],
  };
};

export const Playground: Story = {
  args: { option: columns() },
};

export const ManySeries: Story = {
  name: 'More than one series',
  args: { ariaLabel: 'Scans each month by platform', option: twoSeries() },
};

export const Sized: Story = {
  name: 'Sized by the caller',
  args: { option: columns(), className: 'h-50 w-150' },
};

export const Empty: Story = {
  name: 'Nothing to draw',
  args: { ariaLabel: 'Scans each month', option: {} },
};
