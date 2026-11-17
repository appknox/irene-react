import { useNavigate, useParams } from '@tanstack/react-router';

import type { ApiSavedReportSummary } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { groupSavedReports } from './group';
import { PanelRow } from './panel-row';

interface PanelGroupsProps {
  reports: ApiSavedReportSummary[];
  max: number;
  count: number;
}

/**
 * The panel's sections and their rows, with the report open on the page marked.
 *
 * Deleting the open report goes back to Generate, since its page has nothing
 * left to show.
 *
 * @param props.reports - The reports, in Luna's order.
 * @param props.max - How many reports an account may keep.
 * @param props.count - How many it has.
 */
export function PanelGroups({ reports, max, count }: Readonly<PanelGroupsProps>) {
  const now = new Date();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activeId = 'savedReportId' in params ? Number(params.savedReportId) : undefined;

  const onDeleted = (report: ApiSavedReportSummary) => {
    if (report.id === activeId) {
      void navigate({ to: '/dashboard/reports/generate' });
    }
  };

  return (
    <div className="flex flex-col gap-3" data-test-saved-reports-groups>
      {groupSavedReports(reports, now).map(({ group, reports: rows }) => (
        <section key={group} aria-label={akMT(`reportModule.savedReports.groups.${group}`)}>
          <AkTypography
            variant="body2"
            color="textSecondary"
            fontWeight="medium"
            className="flex items-center gap-1 px-2 pb-1"
          >
            {group === 'pinned' && <AkIcon name="material-symbols:push-pin-outline" className="size-3.5" />}

            {akMT(`reportModule.savedReports.groups.${group}`)}
          </AkTypography>

          <ul className="flex flex-col">
            {rows.map((report) => (
              <PanelRow
                key={report.id}
                report={report}
                isActive={report.id === activeId}
                now={now}
                onDeleted={onDeleted}
              />
            ))}
          </ul>
        </section>
      ))}

      {count >= max && (
        <AkTypography variant="body2" color="textSecondary" className="px-2" data-test-saved-reports-limit>
          {akMT('reportModule.savedReports.limitReached', { max })}
        </AkTypography>
      )}
    </div>
  );
}
