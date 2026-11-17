import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AkModal,
  AkModalBody,
  AkModalClose,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
} from '@irene/ui/ak-modal';

import { SavedReportService, type ApiSavedReportSummary } from '@irene/api/services/saved-report';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { savedReportKeys } from '@/features/reports/queries/saved-reports';
import { getLunaErrorMessage } from '@/features/reports/utils';

interface DeleteReportDialogProps {
  report: Pick<ApiSavedReportSummary, 'id' | 'name'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Asks before deleting a saved report, then deletes it.
 *
 * Luna keeps a deleted report, so the toast that confirms the delete offers to
 * undo it; Undo closes its own toast, and a refused undo (the name was reused,
 * say) says why. The dialog closes as soon as the delete lands.
 *
 * @param props.report - The report to delete.
 * @param props.open - Whether the dialog is open.
 * @param props.onOpenChange - Opens or closes it.
 * @param props.onDeleted - Runs once the report is deleted, before the lists reload.
 */
export function DeleteReportDialog(props: Readonly<DeleteReportDialogProps>) {
  const { report, open, onOpenChange, onDeleted } = props;
  const queryClient = useQueryClient();
  const reloadLists = () => queryClient.invalidateQueries({ queryKey: savedReportKeys.lists() });

  const restore = useMutation({
    mutationFn: () => SavedReportService.restoreSavedReport(report.id),
    onSuccess: async () => {
      await reloadLists();
      akNotify.success(akMT('reportModule.savedReports.restored'));
    },
    onError: unlessRateLimited((error) => {
      akNotify.error(getLunaErrorMessage(error));
    }),
  });

  const remove = useMutation({
    mutationFn: () => SavedReportService.deleteSavedReport(report.id),
    onSuccess: async () => {
      onOpenChange(false);
      onDeleted?.();
      await reloadLists();

      const toastId: string | number = akNotify.success(akMT('reportModule.savedReports.deleted'), {
        description: (
          <AkButton
            variant="text"
            noPadding
            onClick={() => {
              akNotify.dismiss(toastId);
              restore.mutate();
            }}
            data-test-saved-report-undo
          >
            {akMT('undo')}
          </AkButton>
        ),
      });
    },
    onError: unlessRateLimited((error) => {
      akNotify.error(getLunaErrorMessage(error));
    }),
  });

  return (
    <AkModal open={open} onOpenChange={onOpenChange}>
      <AkModalContent aria-describedby={undefined}>
        <AkModalHeader title={akMT('reportModule.savedReports.deleteTitle')} closeLabel={akMT('close')} />

        <AkModalBody>
          <AkTypography>{akMT('reportModule.savedReports.deleteBody', { name: report.name })}</AkTypography>
        </AkModalBody>

        <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
          <AkModalClose asChild>
            <AkButton type="button" variant="outlined" color="neutral" disabled={remove.isPending}>
              {akMT('reportModule.savedReports.keepIt')}
            </AkButton>
          </AkModalClose>

          <AkButton type="button" color="error" loading={remove.isPending} onClick={() => remove.mutate()}>
            {akMT('reportModule.savedReports.deleteReport')}
          </AkButton>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  );
}
