import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';

interface Finding {
  id: string;
  title: string;
  severity: string;
  files: number;
}

const column = createAkTableColumns<Finding>();

const severityCell = ({ getValue }: { getValue: () => string }) => (
  <AkTypography tag="span" color={getValue() === 'High' ? 'error' : 'textSecondary'}>
    {getValue()}
  </AkTypography>
);

/** The default set: three columns whose widths add up to the table. */
const COLUMNS = column.columns([
  column.accessor('title', { header: 'Finding', meta: { width: '55%' } }),
  column.accessor('severity', { header: 'Severity', meta: { width: '30%' }, cell: severityCell }),
  column.accessor('files', { header: 'Files', meta: { width: '15%' } }),
]);

/** The same columns with no widths, so the browser sizes them to their content. */
const AUTO_COLUMNS = column.columns([
  column.accessor('title', { header: 'Finding' }),
  column.accessor('severity', { header: 'Severity', cell: severityCell }),
  column.accessor('files', { header: 'Files' }),
]);

const FINDINGS: Finding[] = [
  { id: 'a', title: 'Hardcoded secret in source', severity: 'High', files: 3 },
  { id: 'b', title: 'Debuggable build shipped', severity: 'Medium', files: 1 },
  { id: 'c', title: 'Backup allowed in manifest', severity: 'Low', files: 1 },
];

/** Names the variant a block below is showing. */
const Label = ({ children }: { children: ReactNode }) => (
  <span className="text-sm text-foreground-muted">{children}</span>
);

const meta = {
  title: 'Components/AkTable',
  component: AkTable<Finding>,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],

  /* A table stretches to whatever it is given, which reads badly across a full canvas. */
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-150">
        <Story />
      </div>
    ),
  ],

  argTypes: {
    variant: { control: 'inline-radio', options: ['semi-bordered', 'full-bordered', 'borderless'] },
    headerColor: { control: 'inline-radio', options: ['neutral', 'transparent'] },
    borderColor: { control: 'inline-radio', options: ['light', 'dark'] },
    hoverable: { control: 'boolean' },
    dense: { control: 'boolean' },
  },
  args: {
    columns: COLUMNS,
    data: FINDINGS,
    caption: 'Findings',
    variant: 'semi-bordered',
    headerColor: 'neutral',
    borderColor: 'light',
    hoverable: false,
    dense: false,
  },
} satisfies Meta<typeof AkTable<Finding>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `variant`: which rules are drawn. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>
          variant=&quot;semi-bordered&quot; (default) — a rule under every row but the last
        </Label>
        <AkTable {...args} variant="semi-bordered" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>variant=&quot;full-bordered&quot; — every cell boxed</Label>
        <AkTable {...args} variant="full-bordered" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>variant=&quot;borderless&quot; — for a table inside a card that draws its own</Label>
        <AkTable {...args} variant="borderless" />
      </div>
    </div>
  ),
};

/** `headerColor`: whether the header carries a fill of its own. */
export const HeaderColors: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>headerColor=&quot;neutral&quot; (default)</Label>
        <AkTable {...args} headerColor="neutral" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>headerColor=&quot;transparent&quot; — the header follows borderColor instead</Label>
        <AkTable {...args} headerColor="transparent" />
      </div>
    </div>
  ),
};

/** `borderColor`: how strongly the rules between rows are drawn. */
export const BorderColors: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>borderColor=&quot;light&quot; (default) — the faint rule</Label>
        <AkTable {...args} borderColor="light" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>borderColor=&quot;dark&quot; — the stronger one</Label>
        <AkTable {...args} borderColor="dark" />
      </div>
    </div>
  ),
};

/** `dense`: tightens the cells, for a table that has to show more rows at once. */
export const Density: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>dense={'{false}'} (default)</Label>
        <AkTable {...args} dense={false} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>dense={'{true}'}</Label>
        <AkTable {...args} dense />
      </div>
    </div>
  ),
};

/** `hoverable`: tints the row under the pointer, for rows that can be acted on. */
export const Hoverable: Story = { args: { hoverable: true } };

/** Column widths come from each column's `meta`, and switch the table to fixed layout. */
export const ColumnWidths: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>No width set — the browser sizes each column to its content</Label>
        <AkTable {...args} columns={AUTO_COLUMNS} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>meta.width 55% / 30% / 15% — laid out fixed, so the widths hold</Label>
        <AkTable {...args} columns={COLUMNS} />
      </div>
    </div>
  ),
};

/** A column renders whatever it returns, so a cell may carry a control. */
export const CellsWithControls: Story = {
  args: {
    hoverable: true,
    columns: column.columns([
      column.accessor('title', { header: 'Finding', meta: { width: '70%' } }),
      column.accessor('severity', {
        header: 'Severity',
        meta: { width: '15%' },
        cell: severityCell,
      }),
      column.display({
        id: 'open',
        header: '',
        meta: { width: '15%' },
        cell: ({ row }) => (
          <AkButton
            variant="text"
            color="primary"
            noPadding
            aria-label={`Open ${row.original.title}`}
          >
            <AkIcon name="material-symbols:arrow-forward" />
          </AkButton>
        ),
      }),
    ]),
  },
};

/** A cell holds whatever it is given, so long text wraps rather than overflowing. */
export const LongContent: Story = {
  args: {
    data: [
      {
        id: 'a',
        title:
          'A backup of the application is allowed in the manifest, which lets anyone with physical access copy its data off the device without unlocking it',
        severity: 'Medium',
        files: 12,
      },
      ...FINDINGS,
    ],
  },
};

/** More columns than fit: the wrapper scrolls sideways rather than squeezing them. */
export const Overflowing: Story = {
  args: {
    wrapperClassName: 'max-w-100',
    columns: column.columns([
      column.accessor('title', { header: 'Finding', meta: { width: '40rem' } }),
      column.accessor('severity', { header: 'Severity', meta: { width: '12rem' } }),
      column.accessor('files', { header: 'Files', meta: { width: '10rem' } }),
    ]),
  },
};

/** One row, which is where a rule under the last row would look wrong. */
export const SingleRow: Story = { args: { data: [FINDINGS[0]] } };

/** No rows, with something to say instead. */
export const Empty: Story = {
  args: { data: [], emptyState: <AkTypography color="textSecondary">No findings</AkTypography> },
};

/** No rows and nothing to say: the header stands on its own. */
export const EmptyWithoutMessage: Story = { args: { data: [] } };
