import { useState } from 'react';

import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import type { ApiReportFilterField } from '@irene/api/services/report-request';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { FilterValue } from './filter-value';

import {
  getFilterOperators,
  isConditionComplete,
  normaliseCondition,
  type FilterCondition,
  type FilterOperator,
} from './state';

/** The most conditions one report takes; Luna allows 50, and a dozen covers any real question. */
export const MAX_FILTER_CONDITIONS = 12;

/** Each operator's label, from irene's own wording. */
const OPERATOR_LABELS: Record<FilterOperator, () => string> = {
  eq: () => akMT('reportModule.advancedFilters.equalTo'),
  neq: () => akMT('reportModule.advancedFilters.notEqualTo'),
  gt: () => akMT('reportModule.advancedFilters.greaterThan'),
  gte: () => akMT('reportModule.advancedFilters.greaterThanOrEqual'),
  lt: () => akMT('reportModule.advancedFilters.lessThan'),
  lte: () => akMT('reportModule.advancedFilters.lessThanOrEqual'),
  in: () => akMT('reportModule.advancedFilters.anyOf'),
  not_in: () => akMT('reportModule.advancedFilters.noneOf'),
  contains: () => akMT('reportModule.advancedFilters.contains'),
  icontains: () => akMT('reportModule.advancedFilters.containsCaseInsensitive'),
  startswith: () => akMT('reportModule.advancedFilters.startsWith'),
  endswith: () => akMT('reportModule.advancedFilters.endsWith'),
  isnull: () => akMT('reportModule.advancedFilters.doesNotExist'),
};

interface FiltersPopoverProps {
  fields: ApiReportFilterField[];
  filters: FilterCondition[];
  rowCount: number;
  onApply: (filters: FilterCondition[]) => void;
}

/** A new condition on the first column not yet filtered, with that column's first operator. */
const _newCondition = (field: ApiReportFilterField): FilterCondition => ({
  field: field.field,
  operator: getFilterOperators(field)[0] ?? 'eq',
  value: null,
});

/**
 * Advanced filters: conditions, all of which a row must meet, each on its own
 * column. Edits stay a draft until Apply; a condition without a value is left
 * out. Filters narrow the table and downloads, never the chart.
 *
 * @param props.fields - The columns that can be filtered.
 * @param props.filters - The conditions applied now.
 * @param props.rowCount - How many rows the table shows now.
 * @param props.onApply - Receives the conditions to apply.
 */
export function FiltersPopover({ fields, filters, rowCount, onApply }: Readonly<FiltersPopoverProps>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterCondition[]>(filters);
  const byField = new Map(fields.map((field) => [field.field, field]));
  const unused = fields.filter((field) => !draft.some((condition) => condition.field === field.field));

  const openChange = (isOpen: boolean) => {
    setDraft(isOpen && filters.length === 0 && fields[0] ? [_newCondition(fields[0])] : filters);
    setOpen(isOpen);
  };

  const update = (index: number, change: Partial<FilterCondition>) =>
    setDraft(draft.map((condition, at) => (at === index ? { ...condition, ...change } : condition)));

  const changeField = (index: number, fieldName: string) => {
    const field = byField.get(fieldName);

    if (field) {
      setDraft(draft.map((condition, at) => (at === index ? _newCondition(field) : condition)));
    }
  };

  const apply = () => {
    onApply(
      draft.flatMap((condition) => {
        const field = byField.get(condition.field);

        return field && isConditionComplete(condition) ? [normaliseCondition(condition, field)] : [];
      })
    );

    setOpen(false);
  };

  return (
    <AkPopover open={open} onOpenChange={openChange}>
      <AkPopoverTrigger asChild>
        <AkButton
          variant="outlined"
          color="primary"
          size="sm"
          disabled={fields.length === 0}
          leftIcon={<AkIcon name="material-symbols:add" />}
          data-test-report-filters-trigger
        >
          {akMT('reportModule.advancedFilter')} · {filters.length}
        </AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent align="start" className="w-180 max-w-[90vw] p-0" data-test-report-filters>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <AkTypography fontWeight="medium">{akMT('reportModule.advancedFilter')}</AkTypography>

          <AkButton variant="text" size="sm" disabled={draft.length === 0} onClick={() => setDraft([])}>
            {akMT('reportModule.view.clearAll')}
          </AkButton>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3">
          {draft.map((condition, index) => {
            const field = byField.get(condition.field);

            return field ? (
              <div key={`${condition.field}-${index}`} className="flex items-start gap-2" data-test-report-filter-row>
                <AkTypography tag="span" color="textSecondary" className="w-14 shrink-0 pt-2">
                  {index === 0 ? akMT('reportModule.advancedFilters.where') : akMT('reportModule.view.and')}
                </AkTypography>

                <AkSelect value={condition.field} onValueChange={(value) => changeField(index, value)}>
                  <AkSelectTrigger aria-label={akMT('reportModule.advancedFilters.selectField')} className="w-44">
                    <AkSelectValue />
                  </AkSelectTrigger>

                  <AkSelectContent position="popper">
                    {[field, ...unused].map((option) => (
                      <AkSelectItem key={option.field} value={option.field}>
                        {option.label}
                      </AkSelectItem>
                    ))}
                  </AkSelectContent>
                </AkSelect>

                <AkSelect
                  value={condition.operator}
                  onValueChange={(operator) =>
                    update(index, { operator: operator as FilterOperator, value: null })
                  }
                >
                  <AkSelectTrigger aria-label={akMT('reportModule.view.filterOperator')} className="w-40">
                    <AkSelectValue />
                  </AkSelectTrigger>

                  <AkSelectContent position="popper">
                    {getFilterOperators(field).map((operator) => (
                      <AkSelectItem key={operator} value={operator}>
                        {OPERATOR_LABELS[operator]()}
                      </AkSelectItem>
                    ))}
                  </AkSelectContent>
                </AkSelect>

                <FilterValue field={field} condition={condition} onChange={(value) => update(index, { value })} />

                <AkIconButton
                  size="small"
                  aria-label={akMT('reportModule.view.removeCondition', { column: field.label })}
                  onClick={() => setDraft(draft.filter((_, at) => at !== index))}
                >
                  <AkIcon name="material-symbols:delete-outline" />
                </AkIconButton>
              </div>
            ) : null;
          })}

          <AkButton
            variant="text"
            color="primary"
            size="sm"
            className="w-fit"
            disabled={unused.length === 0 || draft.length >= MAX_FILTER_CONDITIONS}
            leftIcon={<AkIcon name="material-symbols:add" />}
            onClick={() => unused[0] && setDraft([...draft, _newCondition(unused[0])])}
          >
            {akMT('reportModule.advancedFilters.addNewCondition')}
          </AkButton>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5">
          <AkTypography variant="body2" color="textSecondary">
            {akMT('reportModule.view.filtersHelp', { count: rowCount })}
          </AkTypography>

          <div className="flex shrink-0 gap-2">
            <AkButton variant="outlined" color="neutral" onClick={() => setOpen(false)}>
              {akMT('cancel')}
            </AkButton>

            <AkButton onClick={apply} data-test-report-filters-apply>
              {akMT('reportModule.view.applyFilters')}
            </AkButton>
          </div>
        </div>
      </AkPopoverContent>
    </AkPopover>
  );
}
