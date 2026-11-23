import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { AkPagination } from '@irene/ui/ak-pagination';
import { getAkPaginationState } from '@irene/ui/ak-pagination/helpers';

function renderPagination(props: Partial<Parameters<typeof AkPagination>[0]> = {}) {
  const onPageChange = vi.fn();
  const onItemPerPageChange = vi.fn();

  render(
    <AkPagination
      totalItems={25}
      limit={10}
      offset={0}
      itemPerPageOptions={[10, 25, 50]}
      onPageChange={onPageChange}
      onItemPerPageChange={onItemPerPageChange}
      tableItemLabel="apps"
      perPageLabel="Records per page"
      {...props}
    />
  );

  return { onPageChange, onItemPerPageChange };
}

describe('AkPagination', () => {
  it('shows the range on screen out of the total', () => {
    renderPagination({ offset: 10 });

    expect(
      screen.getByText(akMT('paginationRange', { start: 11, end: 20, total: 25, label: 'apps' }))
    ).toBeInTheDocument();
  });

  it('ends the range at the last row on the final page', () => {
    renderPagination({ offset: 20 });

    expect(
      screen.getByText(akMT('paginationRange', { start: 21, end: 25, total: 25, label: 'apps' }))
    ).toBeInTheDocument();
  });

  it('hides the range while there are no rows', () => {
    renderPagination({ totalItems: 0 });

    expect(
      screen.queryByText(akMT('paginationRange', { start: 1, end: 0, total: 0, label: 'apps' }))
    ).not.toBeInTheDocument();
  });

  it('asks for the next page from the end of this one', async () => {
    const { onPageChange } = renderPagination();

    await userEvent.click(screen.getByRole('button', { name: akMT('next') }));

    expect(onPageChange).toHaveBeenCalledWith({ limit: 10, offset: 10 });
  });

  it('asks for the previous page from the start of this one', async () => {
    const { onPageChange } = renderPagination({ offset: 20 });

    await userEvent.click(screen.getByRole('button', { name: akMT('previous') }));

    expect(onPageChange).toHaveBeenCalledWith({ limit: 10, offset: 10 });
  });

  it('asks for the first page, never a negative offset, from a page that starts mid-way', async () => {
    const { onPageChange } = renderPagination({ offset: 5 });

    await userEvent.click(screen.getByRole('button', { name: akMT('previous') }));

    expect(onPageChange).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('shows the last page for an offset past the last row', () => {
    renderPagination({ totalItems: 12, offset: 40 });

    expect(
      screen.getByText(akMT('paginationRange', { start: 11, end: 12, total: 12, label: 'apps' }))
    ).toBeInTheDocument();
  });

  it('marks the nav with its variant', () => {
    renderPagination({ variant: 'compact' });

    expect(screen.getByRole('navigation')).toHaveAttribute('data-variant', 'compact');
  });

  it('closes the previous page on the first page and the next on the last', () => {
    renderPagination({ totalItems: 8 });

    expect(screen.getByRole('button', { name: akMT('previous') })).toBeDisabled();
    expect(screen.getByRole('button', { name: akMT('next') })).toBeDisabled();
  });

  it('names the page-size picker by its label and shows the size in effect', () => {
    renderPagination({ limit: 25 });

    expect(screen.getByRole('combobox', { name: 'Records per page' })).toHaveTextContent('25');
  });

  it('keeps the arrows and names them when compact', () => {
    renderPagination({ variant: 'compact' });

    expect(screen.getByRole('button', { name: akMT('next') })).not.toHaveTextContent(akMT('next'));
  });
});

describe('getAkPaginationState', () => {
  it('falls back to the first option for a limit the options do not offer', () => {
    expect(
      getAkPaginationState({ totalItems: 30, limit: 7, offset: 0, itemPerPageOptions: [5, 10] })
    ).toMatchObject({ limit: 5, endItemIdx: 5 });
  });

  it('moves an offset past the last row to the start of the last page', () => {
    expect(getAkPaginationState({ totalItems: 12, limit: 10, offset: 40 })).toMatchObject({
      offset: 10,
      startItemIdx: 11,
      endItemIdx: 12,
      disablePrev: false,
      disableNext: true,
    });
  });

  it('moves an offset at the row count back a page when the rows fill it exactly', () => {
    expect(getAkPaginationState({ totalItems: 20, limit: 10, offset: 20 })).toMatchObject({
      offset: 10,
      startItemIdx: 11,
      endItemIdx: 20,
    });
  });

  it('keeps the offset at zero while there are no rows', () => {
    expect(getAkPaginationState({ totalItems: 0, limit: 10, offset: 30 })).toMatchObject({
      offset: 0,
      disablePrev: true,
      disableNext: true,
    });
  });

  it('offers irene’s default sizes when given none', () => {
    expect(
      getAkPaginationState({ totalItems: 1, limit: 5, offset: 0, itemPerPageOptions: [] }).options
    ).toEqual([5, 10, 20, 30, 40]);
  });
});
