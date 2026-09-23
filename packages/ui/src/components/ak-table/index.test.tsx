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
  it('renders a table a screen reader can read as one', () => {
    renderTable({ caption: 'Findings' });

    expect(screen.getByRole('table', { name: 'Findings' })).toBeInTheDocument();
  });

  it('heads each column from its definition', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Severity' })).toBeInTheDocument();
  });

  it('renders one row per entry, plus the header', () => {
    renderTable();

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('reads each cell from the row it belongs to', () => {
    renderTable();

    expect(screen.getByRole('cell', { name: 'Hardcoded secret' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Low' })).toBeInTheDocument();
  });

  it('renders whatever a column returns, not only text', async () => {
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
  it('shows the empty state in place of the rows', () => {
    renderTable({ data: [], emptyState: 'No findings' });

    expect(screen.getByText('No findings')).toBeInTheDocument();
  });

  it('spans the empty state across every column', () => {
    renderTable({ data: [], emptyState: 'No findings' });

    expect(screen.getByRole('cell', { name: 'No findings' })).toHaveAttribute('colspan', '2');
  });

  it('renders only the header when no empty state was given', () => {
    renderTable({ data: [] });

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});

describe('variants', () => {
  it('draws rules between rows by default', () => {
    renderTable();

    expect(screen.getByRole('table')).toHaveAttribute('data-variant', 'semi-bordered');
  });

  it('boxes every cell when asked to', () => {
    renderTable({ variant: 'full-bordered' });

    expect(screen.getByRole('table')).toHaveAttribute('data-variant', 'full-bordered');
  });

  it('drops the first row top border, which the header already draws', () => {
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
  it('identifies a row by what the caller says identifies it', () => {
    const getRowId = vi.fn((finding: Finding) => finding.id);

    renderTable({ getRowId });

    expect(getRowId).toHaveBeenCalled();
  });

  it('keeps a cell interactive, since a column may render a control', async () => {
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
  it('lays out automatically when no column asks for a width', () => {
    renderTable();

    expect(document.querySelector('colgroup')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveClass('table-fixed');
  });

  it('declares each width on a col, which is where a table carries them', () => {
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

  it('lays out fixed once any width is set, so the widths are honoured exactly', () => {
    const sized = column.columns([
      column.accessor('title', { header: 'Title', meta: { width: '70%' } }),
      column.accessor('severity', { header: 'Severity' }),
    ]);

    render(<AkTable columns={sized} data={FINDINGS} />);

    expect(screen.getByRole('table')).toHaveClass('table-fixed');
  });
});
