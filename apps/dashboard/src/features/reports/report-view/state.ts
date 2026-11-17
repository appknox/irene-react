import type { ApiReportFilterField } from '@irene/api/services/report-request';
import type {
  ApiReportFilterSection,
  ApiSavedReportColumn,
  ApiSavedReportViewConfig,
} from '@irene/api/services/saved-report';

/** The id of the one filter section Luna offers: the report's own columns. */
export const REPORT_FILTER_SECTION = 'report';

/** A column as the view holds it: in the view's order, shown or hidden. */
export interface ViewColumn {
  field: string;
  label: string;
  type: string;
  selected: boolean;
}

/** The comparisons Luna's preview applies (`_match_condition`); nothing else is offered. */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'icontains'
  | 'startswith'
  | 'endswith'
  | 'isnull';

/** One filter condition: a column, how to compare, and what to compare with. */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | null;
}

const NUMBER_TYPES = new Set(['integer', 'float', 'number']);
const DATE_TYPES = new Set(['datetime', 'date']);

/**
 * The comparisons a column offers, by what it holds.
 *
 * A column with fixed values (an enum, a boolean) offers is, is not and any of;
 * numbers and dates add the orderings; text adds the text matches. "Is empty"
 * is offered where a value can be missing.
 *
 * @param field - The filter field.
 * @returns The operators, the default first.
 */
export function getFilterOperators(field: ApiReportFilterField): FilterOperator[] {
  const empty: FilterOperator[] = field.is_nullable ? ['isnull'] : [];

  if (field.choices?.length || field.type === 'boolean') {
    return ['eq', 'neq', 'in', 'not_in', ...empty];
  }

  if (NUMBER_TYPES.has(field.type)) {
    return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', ...empty];
  }

  if (DATE_TYPES.has(field.type)) {
    return ['gte', 'lte', 'gt', 'lt', ...empty];
  }

  return ['icontains', 'eq', 'neq', 'startswith', 'endswith', ...empty];
}

/**
 * The view's columns: the saved order and selection when the view names its
 * columns, the report's defaults otherwise. A saved name the report no longer
 * has is dropped; a report column the view does not name follows, hidden.
 *
 * @param columns - Every column the report can show, in the report's order.
 * @param viewConfig - The saved view settings, if any.
 * @returns The view's columns.
 */
export function buildViewColumns(
  columns: ApiSavedReportColumn[],
  viewConfig?: ApiSavedReportViewConfig | null
): ViewColumn[] {
  const toView = (column: ApiSavedReportColumn, selected: boolean): ViewColumn => ({
    field: column.field,
    label: column.label,
    type: column.type,
    selected,
  });

  const named = viewConfig?.columns;

  if (!named) {
    const anyDefault = columns.some((column) => column.is_default);

    return columns.map((column) => toView(column, anyDefault ? column.is_default : true));
  }

  const byField = new Map(columns.map((column) => [column.field, column]));

  const shown = named.flatMap((field) => {
    const column = byField.get(field);

    return column ? [toView(column, true)] : [];
  });

  const shownFields = new Set(shown.map((column) => column.field));

  return [...shown, ...columns.filter((column) => !shownFields.has(column.field)).map((c) => toView(c, false))];
}

/**
 * The filter sections the API takes, from the view's conditions.
 *
 * @param filters - The conditions, at most one per column.
 * @returns One section holding every condition, or none when there are none.
 */
export function toFilterSections(filters: FilterCondition[]): ApiReportFilterSection[] {
  if (filters.length === 0) {
    return [];
  }

  const details = Object.fromEntries(
    filters.map(({ field, operator, value }) => [field, { operator, value }])
  );

  return [{ id: REPORT_FILTER_SECTION, filter_details: details }];
}

/**
 * The view's conditions from saved filter sections. Nested groups and plain
 * values (`{field: value}`) read as conditions too, so a view saved elsewhere
 * still opens.
 *
 * @param sections - The saved sections.
 * @returns The conditions.
 */
export function fromFilterSections(sections: ApiReportFilterSection[] | undefined): FilterCondition[] {
  return (sections ?? []).flatMap((section) =>
    Object.entries(section.filter_details).flatMap(([field, condition]): FilterCondition[] => {
      if (['AND', 'OR', 'NOT'].includes(field)) {
        return [];
      }

      if (condition && typeof condition === 'object' && !Array.isArray(condition) && 'operator' in condition) {
        const { operator, value } = condition as { operator: FilterOperator; value: FilterCondition['value'] };

        return [{ field, operator, value }];
      }

      return [{ field, operator: 'eq', value: condition as FilterCondition['value'] }];
    })
  );
}

/**
 * The view settings to save: the shown columns in order, and the filters.
 *
 * @param columns - The view's columns.
 * @param filters - The view's conditions.
 * @param chart - The chart settings to keep, if any.
 * @returns The view_config Luna stores.
 */
export function toViewConfig(
  columns: ViewColumn[],
  filters: FilterCondition[],
  chart: ApiSavedReportViewConfig['chart'] = null
): ApiSavedReportViewConfig {
  return {
    version: 1,
    columns: columns.filter((column) => column.selected).map((column) => column.field),
    filters: toFilterSections(filters),
    chart,
  };
}

/** What differs between a saved view and the one on screen. */
export interface ViewChanges {
  hiddenColumns: number;
  shownColumns: number;
  reordered: boolean;
  filtersChanged: boolean;
}

/**
 * What changed since the view was saved, for the status chip and the save drawer.
 *
 * @param saved - The view as saved.
 * @param current - The view on screen.
 * @returns The changes; none when nothing differs.
 */
export function describeViewChanges(
  saved: { columns: ViewColumn[]; filters: FilterCondition[] },
  current: { columns: ViewColumn[]; filters: FilterCondition[] }
): ViewChanges {
  const savedShown = saved.columns.filter((c) => c.selected).map((c) => c.field);
  const currentShown = current.columns.filter((c) => c.selected).map((c) => c.field);
  const savedSet = new Set(savedShown);
  const currentSet = new Set(currentShown);
  const kept = currentShown.filter((field) => savedSet.has(field));

  return {
    hiddenColumns: savedShown.filter((field) => !currentSet.has(field)).length,
    shownColumns: currentShown.filter((field) => !savedSet.has(field)).length,
    reordered: kept.join('\n') !== savedShown.filter((field) => currentSet.has(field)).join('\n'),
    filtersChanged:
      JSON.stringify(toFilterSections(saved.filters)) !== JSON.stringify(toFilterSections(current.filters)),
  };
}

/**
 * Whether anything changed.
 *
 * @param changes - What describeViewChanges found.
 * @returns True when the view on screen is not the saved one.
 */
export const hasViewChanges = (changes: ViewChanges) =>
  changes.hiddenColumns > 0 || changes.shownColumns > 0 || changes.reordered || changes.filtersChanged;

/**
 * A name for a new saved report that no saved report has yet: the name itself,
 * or the name with " (2)", " (3)" and so on, as the design does.
 *
 * @param name - The name wanted.
 * @param taken - The names already used, compared without regard to case.
 * @param maxLength - The longest name Luna keeps.
 * @returns A free name.
 */
export function getFreeReportName(name: string, taken: string[], maxLength: number): string {
  const used = new Set(taken.map((value) => value.toLowerCase()));
  const base = name.trim().slice(0, maxLength);

  if (!used.has(base.toLowerCase())) {
    return base;
  }

  for (let copy = 2; ; copy += 1) {
    const suffix = ` (${copy})`;
    const candidate = `${base.slice(0, maxLength - suffix.length)}${suffix}`;

    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

/**
 * The value a condition sends, typed as the column holds it: Luna compares
 * numbers with numbers, so a number column's text input is sent as a number.
 *
 * @param condition - The condition as typed.
 * @param field - The column it filters.
 * @returns The condition ready to send.
 */
export function normaliseCondition(condition: FilterCondition, field: ApiReportFilterField): FilterCondition {
  if (condition.operator === 'isnull') {
    return { ...condition, value: true };
  }

  if (NUMBER_TYPES.has(field.type) && typeof condition.value === 'string' && condition.value.trim() !== '') {
    const number = Number(condition.value);

    return Number.isNaN(number) ? condition : { ...condition, value: number };
  }

  return condition;
}

/**
 * Whether a condition has what it needs to filter.
 *
 * @param condition - The condition.
 * @returns False for a missing value, or an empty list for any of / none of.
 */
export function isConditionComplete(condition: FilterCondition): boolean {
  if (condition.operator === 'isnull') {
    return true;
  }

  if (Array.isArray(condition.value)) {
    return condition.value.length > 0;
  }

  return condition.value !== null && condition.value !== '';
}
