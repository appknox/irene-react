import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
} from '@irene/ui/ak-drawer';

import type { ApiSavedReport } from '@irene/api/services/saved-report';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { cn } from '@irene/ui/cn';
import { AkButton } from '@irene/ui/ak-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';

import { REPORT_NAME_MAX_LENGTH } from '@/features/reports/schemas/report-name';
import { getLunaErrorMessage } from '@/features/reports/utils';

interface SaveChangesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  whatChanged: string;
  copyName: string;
  update: () => Promise<ApiSavedReport>;
  saveAsNew: (name: string) => Promise<ApiSavedReport>;
  onSaved: (report: ApiSavedReport, asNew: boolean) => void;
}

/**
 * Saves the changes made to a saved report: over it, or as a new report that
 * leaves it exactly as it was.
 *
 * @param props.open - Whether the drawer is open.
 * @param props.onOpenChange - Opens or closes it.
 * @param props.reportName - The saved report's name.
 * @param props.whatChanged - The changes, in words.
 * @param props.copyName - The name a new report starts from.
 * @param props.update - Saves over the report.
 * @param props.saveAsNew - Saves a new report under a name.
 * @param props.onSaved - Runs with the report saved, and whether it is new.
 */
export function SaveChangesDrawer(props: Readonly<SaveChangesDrawerProps>) {
  const { open, onOpenChange, reportName, whatChanged, copyName, update, saveAsNew, onSaved } = props;
  const [asNew, setAsNew] = useState(false);
  const [name, setName] = useState(copyName);
  const [error, setError] = useState('');

  const openChange = (isOpen: boolean) => {
    setAsNew(false);
    setName(copyName);
    setError('');
    onOpenChange(isOpen);
  };

  const saving = useMutation({
    mutationFn: () => (asNew ? saveAsNew(name.trim()) : update()),
    onSuccess: (report) => {
      openChange(false);
      onSaved(report, asNew);
    },
    onError: unlessRateLimited((failure) => setError(getLunaErrorMessage(failure))),
  });

  const option = (isNew: boolean, label: string, description: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={asNew === isNew}
      onClick={() => setAsNew(isNew)}
      className={cn(
        'flex flex-col gap-1 rounded-md border px-3.5 py-3 text-left',
        asNew === isNew ? 'border-primary bg-primary/5' : 'border-border hover:bg-hover-light'
      )}
    >
      <AkTypography tag="span" fontWeight="medium">
        {label}
      </AkTypography>

      <AkTypography tag="span" variant="body2" color="textSecondary">
        {description}
      </AkTypography>
    </button>
  );

  return (
    <AkDrawer open={open} onOpenChange={openChange}>
      <AkDrawerContent className="w-110 max-w-full" aria-describedby={undefined}>
        <AkDrawerHeader title={akMT('reportModule.view.saveChanges')} closeLabel={akMT('close')} />

        <AkDrawerBody className="flex flex-1 flex-col gap-4">
          <AkTypography>{akMT('reportModule.view.youChanged', { name: reportName })}</AkTypography>

          <div className="rounded-md bg-background-subtle px-3.5 py-2.5">
            <AkTypography variant="body2" color="textSecondary">
              {akMT('reportModule.view.whatChanged')}
            </AkTypography>

            <AkTypography data-test-save-changes-summary>{whatChanged}</AkTypography>
          </div>

          <div role="radiogroup" aria-label={akMT('reportModule.view.howToSave')} className="flex flex-col gap-2">
            {option(false, akMT('reportModule.view.updateThisReport'), akMT('reportModule.view.updateDescription'))}

            {option(
              true,
              akMT('reportModule.view.saveAsNew'),
              akMT('reportModule.view.saveAsNewDescription', { name: reportName })
            )}
          </div>

          {asNew && (
            <AkInput
              autoFocus
              value={name}
              maxLength={REPORT_NAME_MAX_LENGTH}
              aria-label={akMT('reportModule.view.newReportName')}
              onChange={(event) => setName(event.target.value)}
            />
          )}

          {error && (
            <AkTypography color="error" role="alert">
              {error}
            </AkTypography>
          )}
        </AkDrawerBody>

        <AkDrawerFooter className="flex justify-end gap-2">
          <AkButton variant="outlined" color="neutral" onClick={() => openChange(false)}>
            {akMT('cancel')}
          </AkButton>

          <AkButton
            loading={saving.isPending}
            disabled={asNew && !name.trim()}
            onClick={() => saving.mutate()}
            data-test-save-changes-confirm
          >
            {asNew ? akMT('reportModule.view.saveAsNew') : akMT('reportModule.view.updateReport')}
          </AkButton>
        </AkDrawerFooter>
      </AkDrawerContent>
    </AkDrawer>
  );
}
