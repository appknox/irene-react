import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

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
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';

import { getLunaErrorMessage } from '@/features/reports/utils';

import {
  buildReportNameSchema,
  ReportNameFormField,
  type ReportNameFormSchema,
} from '@/features/reports/schemas/report-name';

interface SaveReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultName: string;
  submitLabel: string;
  save: (name: string) => Promise<ApiSavedReport>;
  onSaved: (report: ApiSavedReport) => void;
}

/**
 * Names a report and saves it: a new report, or a copy of a saved one.
 *
 * The name starts as the report's title, numbered when a saved report already
 * has it. Luna's refusals (a taken name, the limit reached) show under the field.
 *
 * @param props.open - Whether the drawer is open.
 * @param props.onOpenChange - Opens or closes it.
 * @param props.title - The drawer's heading.
 * @param props.defaultName - The name to start from.
 * @param props.submitLabel - The save button's label.
 * @param props.save - Saves under a name.
 * @param props.onSaved - Runs with the saved report.
 */
export function SaveReportDrawer(props: Readonly<SaveReportDrawerProps>) {
  const { open, onOpenChange, title, defaultName, submitLabel, save, onSaved } = props;

  const form = useForm<ReportNameFormSchema>({
    resolver: zodResolver(buildReportNameSchema()),
    defaultValues: { name: defaultName },
    values: { name: defaultName },
    reValidateMode: 'onSubmit',
  });

  const saving = useMutation({
    mutationFn: ({ name }: ReportNameFormSchema) => save(name),
    onSuccess: (report) => {
      onOpenChange(false);
      onSaved(report);
    },
    onError: unlessRateLimited((error) => {
      form.setError('name', { message: getLunaErrorMessage(error) });
    }),
  });

  return (
    <AkDrawer open={open} onOpenChange={onOpenChange}>
      <AkDrawerContent className="w-110 max-w-full" aria-describedby={undefined}>
        <AkFormProvider {...form}>
          <form
            noValidate
            className="flex h-full flex-col"
            onSubmit={form.handleSubmit((values) => saving.mutate(values))}
            data-test-save-report-form
          >
            <AkDrawerHeader title={title} closeLabel={akMT('close')} />

            <AkDrawerBody className="flex-1">
              <ReportNameFormField
                name="name"
                label={akMT('name')}
                description={akMT('reportModule.view.nameHelp')}
              >
                <AkInput autoFocus onFocus={(event) => event.currentTarget.select()} />
              </ReportNameFormField>
            </AkDrawerBody>

            <AkDrawerFooter className="flex justify-end gap-2">
              <AkButton type="button" variant="outlined" color="neutral" onClick={() => onOpenChange(false)}>
                {akMT('cancel')}
              </AkButton>

              <AkButton type="submit" loading={saving.isPending}>
                {submitLabel}
              </AkButton>
            </AkDrawerFooter>
          </form>
        </AkFormProvider>
      </AkDrawerContent>
    </AkDrawer>
  );
}
