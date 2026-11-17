import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { SavedReportService, type ApiSavedReport } from '@irene/api/services/saved-report';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { akNotify } from '@irene/ui/notify';

import { savedReportKeys } from '@/features/reports/queries/saved-reports';
import { getLunaErrorMessage } from '@/features/reports/utils';

import {
  buildReportNameSchema,
  ReportNameFormField,
  type ReportNameFormSchema,
} from '@/features/reports/schemas/report-name';

/**
 * Renames a saved report.
 *
 * Luna's refusals are about the name (taken, empty, too long), so they are
 * shown under the field rather than in a toast.
 *
 * @param props.report - The report to rename.
 */
export function RenameReport({ report }: Readonly<{ report: ApiSavedReport }>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<ReportNameFormSchema>({
    resolver: zodResolver(buildReportNameSchema()),
    defaultValues: { name: report.name },
    reValidateMode: 'onSubmit',
  });

  const rename = useMutation({
    mutationFn: ({ name }: ReportNameFormSchema) => SavedReportService.updateSavedReport(report.id, { name }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(savedReportKeys.detail(report.id), updated);
      await queryClient.invalidateQueries({ queryKey: savedReportKeys.lists() });
      setOpen(false);
      akNotify.success(akMT('reportModule.savedReports.renamed'));
    },
    onError: unlessRateLimited((error) => {
      form.setError('name', { message: getLunaErrorMessage(error) });
    }),
  });

  const openChange = (isOpen: boolean) => {
    form.reset({ name: report.name });
    setOpen(isOpen);
  };

  return (
    <AkModal open={open} onOpenChange={openChange}>
      <AkModalTrigger asChild>
        <AkIconButton size="small" aria-label={akMT('reportModule.savedReports.rename')} data-test-rename-report>
          <AkIcon name="material-symbols:edit-outline" />
        </AkIconButton>
      </AkModalTrigger>

      <AkModalContent aria-describedby={undefined}>
        <AkFormProvider {...form}>
          <form noValidate onSubmit={form.handleSubmit((values) => rename.mutate(values))}>
            <AkModalHeader title={akMT('reportModule.savedReports.rename')} closeLabel={akMT('close')} />

            <AkModalBody>
              <ReportNameFormField name="name" label={akMT('reportModule.savedReports.reportName')}>
                <AkInput autoFocus />
              </ReportNameFormField>
            </AkModalBody>

            <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
              <AkButton type="button" variant="outlined" color="neutral" onClick={() => openChange(false)}>
                {akMT('cancel')}
              </AkButton>

              <AkButton type="submit" loading={rename.isPending}>
                {akMT('save')}
              </AkButton>
            </AkModalFooter>
          </form>
        </AkFormProvider>
      </AkModalContent>
    </AkModal>
  );
}
