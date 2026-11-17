import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { cn } from '@irene/ui/cn';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

/** How far the report is from its saved version, for the chip under the title. */
export type ReportSaveState =
  | { kind: 'notSaved' }
  | { kind: 'saved'; when: string }
  | { kind: 'changed'; summary: string };

interface ReportHeaderProps {
  crumb: string;
  title: ReactNode;
  query: string;
  saveState?: ReportSaveState;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** The chip saying whether the report is saved, and what changed since. */
function SaveStateChip({ state }: Readonly<{ state: ReportSaveState }>) {
  const text =
    state.kind === 'notSaved'
      ? akMT('reportModule.view.notSavedYet')
      : state.kind === 'saved'
        ? akMT('reportModule.view.savedWhen', { when: state.when })
        : akMT('reportModule.view.unsavedChanges', { summary: state.summary });

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm',
        state.kind === 'changed' ? 'bg-danger/10 text-danger' : 'bg-background-subtle text-foreground-muted'
      )}
      data-test-report-save-state={state.kind}
    >
      <span className={cn('size-1.5 rounded-full', state.kind === 'changed' ? 'bg-danger' : 'bg-foreground-muted')} />

      {text}
    </span>
  );
}

/**
 * The top of a report: the way back to Generate, the title, the question it
 * answers, whether it is saved, and its actions.
 *
 * @param props.crumb - Where the report came from: generated or saved.
 * @param props.title - The title, with any control beside it.
 * @param props.query - The question, in the user's words.
 * @param props.saveState - Whether it is saved; left out where saved reports are off.
 * @param props.meta - When the data was fetched, and refresh.
 * @param props.actions - The report's buttons.
 */
export function ReportHeader({ crumb, title, query, saveState, meta, actions }: Readonly<ReportHeaderProps>) {
  return (
    <header className="flex flex-col gap-2 border-b border-border bg-background px-6 pt-4 pb-4" data-test-report-header>
      <nav aria-label={akMT('reportModule.view.breadcrumb')} className="flex items-center gap-1.5 text-sm">
        <Link to="/dashboard/reports/generate" className="text-foreground-muted hover:text-foreground">
          {akMT('reportModule.aiGenerateEngine')}
        </Link>

        <span className="text-foreground-muted">/</span>

        <span aria-current="page" className="font-medium">
          {crumb}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {title}

          <AkTypography color="textSecondary" className="flex items-center gap-1.5" data-test-report-query>
            <AkIcon name="material-symbols:auto-awesome" className="shrink-0 text-info" />

            {query}
          </AkTypography>

          {(saveState || meta) && (
            <div className="flex flex-wrap items-center gap-3">
              {saveState && <SaveStateChip state={saveState} />}

              {meta}
            </div>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
