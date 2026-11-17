import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';

import type { SavedReportService } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

import { savedReportsOptions } from '@/features/reports/queries/saved-reports';

import { PanelGroups } from './panel-groups';
import { usePanelOpen } from './use-panel-open';

/** How long a search may be; Luna reads no more than this. */
const SEARCH_MAX_LENGTH = 200;

/**
 * The account's saved reports, beside every reporting page: pinned ones on top,
 * the rest by when they last changed, with a search over names and questions.
 *
 * It folds away to a thin rail carrying the count, and stays the way the
 * account left it. Deleting the report that is open goes back to Generate.
 */
export function SavedReportsPanel() {
  const [isOpen, setIsOpen] = usePanelOpen();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const reports = useQuery(savedReportsOptions(deferredSearch));
  const count = reports.data?.count ?? 0;

  if (!isOpen) {
    return (
      <aside
        className="
          flex w-12 shrink-0 flex-col items-center gap-2 border-l border-border bg-background py-3
        "
        data-test-saved-reports-rail
      >
        <AkTooltip title={akMT('reportModule.savedReports.show')}>
          <AkIconButton
            aria-label={akMT('reportModule.savedReports.show')}
            className="relative"
            onClick={() => setIsOpen(true)}
          >
            <AkIcon name="material-symbols:bookmark" />

            {count > 0 && (
              <span className="
                absolute -top-0.5 -right-0.5 rounded-full bg-secondary px-1 text-2xs text-white
                tabular-nums
              ">
                {count}
              </span>
            )}
          </AkIconButton>
        </AkTooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label={akMT('reportModule.savedReports.title')}
      className="flex w-80 shrink-0 flex-col border-l border-border bg-background"
      data-test-saved-reports-panel
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <AkTypography variant="subtitle1" tag="h2" className="flex items-center gap-2">
          {akMT('reportModule.savedReports.title')}

          <span className="
            rounded-full bg-background-subtle px-2 text-sm text-foreground-muted tabular-nums
          ">
            {count}
          </span>
        </AkTypography>

        <AkIconButton
          size="small"
          aria-label={akMT('reportModule.savedReports.hide')}
          onClick={() => setIsOpen(false)}
        >
          <AkIcon name="material-symbols:close" />
        </AkIconButton>
      </div>

      <div className="px-4 pb-2">
        <AkInput
          type="search"
          value={search}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder={akMT('reportModule.savedReports.searchShort')}
          aria-label={akMT('reportModule.savedReports.searchLabel')}
          onChange={(event) => setSearch(event.target.value)}
          data-test-saved-reports-search
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <_PanelBody query={reports} search={deferredSearch} />
      </div>
    </aside>
  );
}

/** One page of the list, as the service answers it. */
type SavedReportsPage = Awaited<ReturnType<typeof SavedReportService.getSavedReports>>;

interface PanelBodyProps {
  query: UseQueryResult<SavedReportsPage>;
  search: string;
}

/** The grouped list, or what stands in for it while it loads, fails or is empty. */
function _PanelBody({ query, search }: Readonly<PanelBodyProps>) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2 px-2 pt-2" data-test-saved-reports-loading>
        <AkSkeleton height="40px" />

        <AkSkeleton height="40px" />

        <AkSkeleton height="40px" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-2 px-2 pt-2" data-test-saved-reports-error>
        <AkTypography fontWeight="medium">{akMT('reportModule.savedReports.loadFailedTitle')}</AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          {akMT('reportModule.savedReports.loadFailedBody')}
        </AkTypography>

        <AkButton variant="outlined" color="neutral" onClick={() => query.refetch()}>
          {akMT('retry')}
        </AkButton>
      </div>
    );
  }

  if (query.data.items.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-2 pt-6 text-center" data-test-saved-reports-empty>
        <AkTypography fontWeight="medium">
          {search
            ? akMT('reportModule.savedReports.noMatchTitle', { search })
            : akMT('reportModule.savedReports.emptyTitle')}
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          {search ? akMT('reportModule.savedReports.noMatchBody') : akMT('reportModule.savedReports.emptyBody')}
        </AkTypography>
      </div>
    );
  }

  return <PanelGroups reports={query.data.items} max={query.data.maxSavedReports} count={query.data.count} />;
}
