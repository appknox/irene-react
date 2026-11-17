import { useMemo, useState } from 'react';

import type { ApiSavedReportColumn, ApiSavedReportViewConfig } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';

import {
  buildViewColumns,
  describeViewChanges,
  fromFilterSections,
  hasViewChanges,
  toFilterSections,
  toViewConfig,
  type FilterCondition,
  type ViewChanges,
  type ViewColumn,
} from './state';

/** The page a report opens on, as irene opens it. */
export const FIRST_PAGE = { limit: 10, offset: 0 };

/**
 * What changed, in words, for the status chip and the save drawer: "1 column
 * hidden, filters changed".
 *
 * @param changes - What describeViewChanges found.
 * @returns The changes, joined.
 */
export function describeChangesInWords(changes: ViewChanges): string {
  const parts = [
    changes.hiddenColumns > 0 && akMT('reportModule.view.columnsHidden', { count: changes.hiddenColumns }),
    changes.shownColumns > 0 && akMT('reportModule.view.columnsShown', { count: changes.shownColumns }),
    changes.reordered && akMT('reportModule.view.columnsReordered'),
    changes.filtersChanged && akMT('reportModule.view.filtersChanged'),
  ];

  return parts.filter((part): part is string => typeof part === 'string').join(', ');
}

/**
 * The table settings a report is shown with: the columns, the filters and the
 * page, starting from the saved view when there is one.
 *
 * The page goes back to the first whenever the filters change. Changes are
 * measured against the saved view, so a saved report knows what is unsaved.
 *
 * @param reportColumns - Every column the report can show, once known.
 * @param savedView - The saved view settings, for a saved report.
 * @returns The settings, their setters, and what changed since they were saved.
 */
export function useReportView(
  reportColumns: ApiSavedReportColumn[] | undefined,
  savedView?: ApiSavedReportViewConfig | null
) {
  const baseColumns = useMemo(
    () => (reportColumns ? buildViewColumns(reportColumns, savedView) : []),
    [reportColumns, savedView]
  );

  const savedFilters = useMemo(() => fromFilterSections(savedView?.filters), [savedView]);

  const [editedColumns, setEditedColumns] = useState<ViewColumn[] | null>(null);
  const [editedFilters, setEditedFilters] = useState<FilterCondition[] | null>(null);
  const [page, setPage] = useState(FIRST_PAGE);

  const columns = editedColumns ?? baseColumns;
  const filters = editedFilters ?? savedFilters;
  const filterSections = useMemo(() => toFilterSections(filters), [filters]);

  const changes = describeViewChanges({ columns: baseColumns, filters: savedFilters }, { columns, filters });

  return {
    columns,
    filters,
    filterSections,
    page,
    changes,
    isChanged: hasViewChanges(changes),
    changesInWords: describeChangesInWords(changes),
    viewConfig: toViewConfig(columns, filters, savedView?.chart ?? null),
    setColumns: setEditedColumns,
    resetColumns: () => setEditedColumns(null),
    applyFilters: (next: FilterCondition[]) => {
      setEditedFilters(next);
      setPage((current) => ({ ...current, offset: 0 }));
    },
    setPage,
    discard: () => {
      setEditedColumns(null);
      setEditedFilters(null);
      setPage(FIRST_PAGE);
    },
  };
}

/** The view state a report page works with. */
export type ReportView = ReturnType<typeof useReportView>;
