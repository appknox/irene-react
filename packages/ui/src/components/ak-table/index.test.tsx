import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';

interface Finding {
  id: string;
  title: string;
  severity: string;
}

const column = createAkTableColumns<Finding>();

const COLUMNS = column.columns([
  column.accessor('title', { header: 'Title' }),
  column.accessor('severity', { header: 'Severity' }),
]);

const FINDINGS: Finding[] = [
  { id: 'a', title: 'Hardcoded secret', severity: 'High' },
  { id: 'b', title: 'Debuggable build', severity: 'Low' },
];

const renderTable = (props: Partial<React.ComponentProps<typeof AkTable<Finding>>> = {}) =>
  render(<AkTable columns={COLUMNS} data={FINDINGS} {...props} />);

describe('rendering', () => {
  it('renders an element with the table role and the caption as its name', () => {
    renderTable({ caption: 'Findings' });

    expect(screen.getByRole('table', { name: 'Findings' })).toBeInTheDocument();
  });

  it('renders a column header per column definition', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Severity' })).toBeInTheDocument();
  });

  it('renders one row per data entry plus the header row', () => {
    renderTable();

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('renders each cell from its own row data', () => {
    renderTable();

    expect(screen.getByRole('cell', { name: 'Hardcoded secret' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Low' })).toBeInTheDocument();
  });

  it('renders the element a column cell returns, not only text', async () => {
    const withAction = column.columns([
      column.display({
        id: 'open',
        header: 'Open',
        cell: ({ row }) => <button type="button">Open {row.original.title}</button>,
      }),
    ]);

    render(<AkTable columns={withAction} data={FINDINGS} />);

    expect(screen.getByRole('button', { name: 'Open Debuggable build' })).toBeInTheDocument();
  });
});

describe('empty data', () => {
  it('renders the empty state in place of the rows when data is empty', () => {
    renderTable({ data: [], emptyState: 'No findings' });

    expect(screen.getByText('No findings')).toBeInTheDocument();
  });

  it('spans the empty state cell across every column', () => {
    renderTable({ data: [], emptyState: 'No findings' });

    expect(screen.getByRole('cell', { name: 'No findings' })).toHaveAttribute('colspan', '2');
  });

  it('renders only the header row when no empty state is given', () => {
    renderTable({ data: [] });

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});

describe('variants', () => {
  it('renders a bottom border on each row by default', () => {
    renderTable();

    expect(screen.getByRole('table')).toHaveAttribute('data-variant', 'semi-bordered');
  });

  it('renders a border on every cell with the full-bordered variant', () => {
    renderTable({ variant: 'full-bordered' });

    expect(screen.getByRole('table')).toHaveAttribute('data-variant', 'full-bordered');
  });

  it('renders no top border on the first row, which the header already draws', () => {
    renderTable({ variant: 'full-bordered' });

    expect(screen.getByRole('table')).toHaveClass('[&_tbody_tr:first-child_td]:border-t-0');
  });

  it('lets a caller override a conflicting class', () => {
    renderTable({ className: 'text-right' });

    expect(screen.getByRole('table')).toHaveClass('text-right');
    expect(screen.getByRole('table')).not.toHaveClass('text-left');
  });
});

describe('rows', () => {
  it('keys each row with the id getRowId returns', () => {
    const getRowId = vi.fn((finding: Finding) => finding.id);

    renderTable({ getRowId });

    expect(getRowId).toHaveBeenCalled();
  });

  it('leaves a control inside a cell clickable', async () => {
    const onOpen = vi.fn();

    const withAction = column.columns([
      column.display({
        id: 'open',
        header: 'Open',
        cell: () => (
          <button type="button" onClick={onOpen}>
            Open
          </button>
        ),
      }),
    ]);

    render(<AkTable columns={withAction} data={[FINDINGS[0]]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });
});

describe('column widths', () => {
  it('renders table-layout auto when no column sets a width', () => {
    renderTable();

    expect(document.querySelector('colgroup')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveClass('table-fixed');
  });

  it('renders each column width on a col element', () => {
    const sized = column.columns([
      column.accessor('title', { header: 'Title', meta: { width: '70%' } }),
      column.accessor('severity', { header: 'Severity', meta: { width: '30%' } }),
    ]);

    render(<AkTable columns={sized} data={FINDINGS} />);

    const cols = document.querySelectorAll('colgroup col');

    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveStyle({ width: '70%' });
    expect(cols[1]).toHaveStyle({ width: '30%' });
  });

  it('renders table-layout fixed once any column sets a width', () => {
    const sized = column.columns([
      column.accessor('title', { header: 'Title', meta: { width: '70%' } }),
      column.accessor('severity', { header: 'Severity' }),
    ]);

    render(<AkTable columns={sized} data={FINDINGS} />);

    expect(screen.getByRole('table')).toHaveClass('table-fixed');
  });
});

describe('grouped columns', () => {
  const GROUPED = column.columns([
    column.group({
      id: 'finding',
      header: 'Finding',
      columns: column.columns([
        column.group({
          id: 'what',
          header: 'What',
          columns: column.columns([column.accessor('title', { header: 'Title' })]),
        }),
      ]),
    }),

    /* One level shallower, so the row beside 'What' holds a placeholder cell. */
    column.group({
      id: 'severity',
      header: 'Severity',
      columns: column.columns([column.accessor('severity', { header: 'Rating' })]),
    }),
  ]);

  it('renders an empty header cell above a column that belongs to no group', () => {
    render(<AkTable columns={GROUPED} data={FINDINGS} />);

    const [groupRow] = screen.getAllByRole('row');

    expect(groupRow?.textContent).toBe('FindingSeverity');
    expect(screen.getAllByRole('columnheader', { name: '' })).not.toHaveLength(0);
  });
});
