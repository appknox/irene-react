import { useId, type ComponentProps, type ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { getAkPaginationState, type AkPaginationPage } from './helpers';

type AkPaginationProps = Omit<ComponentProps<'nav'>, 'onChange'> & {
  totalItems: number;
  limit: number;
  offset: number;
  itemPerPageOptions?: number[];
  onPageChange: (page: AkPaginationPage) => void;
  onItemPerPageChange: (page: AkPaginationPage) => void;
  tableItemLabel?: string;
  perPageLabel?: ReactNode;
  variant?: 'default' | 'compact';
};

/**
 * The bar under a paginated list. It holds no state: the list keeps its limit and
 * offset wherever it likes and the bar reports the page asked for.
 *
 * @param props.totalItems - Rows across every page; the range is hidden while it is zero.
 * @param props.onItemPerPageChange - Called with the new page size and an offset of 0.
 * @param props.tableItemLabel - What the rows are, after the count: "1-10 of 25 apps".
 * @param props.variant - `compact` drops the button labels and keeps the arrows.
 */
function AkPagination({
  totalItems,
  limit,
  offset,
  itemPerPageOptions,
  onPageChange,
  onItemPerPageChange,
  tableItemLabel,
  perPageLabel,
  variant = 'default',
  className,
  ...props
}: Readonly<AkPaginationProps>) {
  const state = getAkPaginationState({ totalItems, limit, offset, itemPerPageOptions });
  const isCompact = variant === 'compact';
  const perPageLabelId = useId();

  return (
    <nav
      data-slot="pagination"
      data-variant={variant}
      className={cn('flex items-center justify-between gap-3 bg-neutral-100 px-4 py-3', className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <AkTypography tag="span" fontWeight="medium" id={perPageLabelId}>
          {perPageLabel}
        </AkTypography>

        <AkSelect
          value={String(state.limit)}
          onValueChange={(value) => onItemPerPageChange({ limit: Number(value), offset: 0 })}
        >
          <AkSelectTrigger size="sm" aria-labelledby={perPageLabelId}>
            <AkSelectValue />
          </AkSelectTrigger>

          <AkSelectContent>
            {state.options.map((option) => (
              <AkSelectItem key={option} value={String(option)}>
                {option}
              </AkSelectItem>
            ))}
          </AkSelectContent>
        </AkSelect>

        {totalItems > 0 && (
          <AkTypography
            tag="span"
            className="border-l border-border pl-3"
            data-slot="pagination-range"
          >
            {akMT('paginationRange', {
              start: state.startItemIdx,
              end: state.endItemIdx,
              total: totalItems,
              label: tableItemLabel ?? '',
            })}
          </AkTypography>
        )}
      </div>

      <div className="flex items-center gap-3">
        <AkButton
          variant="outlined"
          color="neutral"
          disabled={state.disablePrev}
          aria-label={isCompact ? akMT('previous') : undefined}
          leftIcon={<AkIcon name="material-symbols:arrow-left" />}
          onClick={() =>
            onPageChange({ limit: state.limit, offset: Math.max(0, state.offset - state.limit) })
          }
        >
          {!isCompact && akMT('previous')}
        </AkButton>

        <AkButton
          variant="outlined"
          color="neutral"
          disabled={state.disableNext}
          aria-label={isCompact ? akMT('next') : undefined}
          rightIcon={<AkIcon name="material-symbols:arrow-right" />}
          onClick={() => onPageChange({ limit: state.limit, offset: state.offset + state.limit })}
        >
          {!isCompact && akMT('next')}
        </AkButton>
      </div>
    </nav>
  );
}

export { AkPagination };
export type { AkPaginationPage };
