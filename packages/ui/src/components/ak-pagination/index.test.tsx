import { cleanup, render, screen } from '@testing-library/react';
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

describe('the pagination bar against the design', () => {
  const previous = () => screen.getByRole('button', { name: akMT('previous') });
  const next = () => screen.getByRole('button', { name: akMT('next') });

  /** The rules between the bar's groups, which carry no meaning of their own. */
  const rules = () => document.querySelectorAll('span[aria-hidden].w-px');

  it('sizes its buttons to the bar rather than to a form', () => {
    renderPagination();

    expect(previous()).toHaveClass('h-7.5');
    expect(next()).toHaveClass('h-7.5');
  });

  it('draws the controls on white, against the bar behind them', () => {
    renderPagination();

    expect(previous()).toHaveClass('bg-background');
    expect(screen.getByRole('combobox')).toHaveClass('bg-background');
  });

  it('rules off the range from the page size, and the buttons from both', () => {
    renderPagination();

    expect(rules()).toHaveLength(2);
  });

  it('drops the rule before the buttons when compact', () => {
    renderPagination({ variant: 'compact' });

    expect(rules()).toHaveLength(1);
  });

  it('draws no rule beside a range it is not showing', () => {
    renderPagination({ totalItems: 0 });

    expect(rules()).toHaveLength(1);
  });
});

describe('the spacing between the bar\'s controls', () => {
  /*
    Tailwind emits a spacing utility only for values of at most two decimals, so
    a class like `gap-2.625` silently produces no rule and the controls sit flush
    against each other. These name the classes rather than measure them, since
    jsdom computes no stylesheet.
  */
  const groups = () => document.querySelectorAll('[data-slot="pagination"] > div');

  it('spaces the page size from its label, and the range from both', () => {
    renderPagination();

    expect(groups()[0]).toHaveClass('gap-2.5');
  });

  it('spaces the buttons from each other', () => {
    renderPagination();

    expect(groups()[1]).toHaveClass('gap-2.5');
  });
});

describe('the page size the bar is showing', () => {
  it('reads out the size in use', () => {
    renderPagination({ limit: 25 });

    expect(screen.getByRole('combobox')).toHaveTextContent('25');
  });

  it('reads out the one chosen, once the caller has taken it', async () => {
    const user = userEvent.setup();

    const { onItemPerPageChange } = renderPagination({ limit: 10 });

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '50' }));

    /* The bar holds no state of its own; the caller owns the page and hands it back. */
    expect(onItemPerPageChange).toHaveBeenCalledWith({ limit: 50, offset: 0 });

    cleanup();
    renderPagination({ limit: 50 });

    expect(screen.getByRole('combobox')).toHaveTextContent('50');
  });

  it('leaves the size room to be read', () => {
    renderPagination();

    expect(screen.getByRole('combobox')).not.toHaveClass('w-12.5');
  });
});
