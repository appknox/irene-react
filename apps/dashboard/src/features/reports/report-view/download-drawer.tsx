import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { cn } from '@irene/ui/cn';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import CsvIcon from '@irene/ui/svgs/csv-icon.svg?react';
import XlsxIcon from '@irene/ui/svgs/xlsx-icon.svg?react';

import { getLunaErrorMessage } from '@/features/reports/utils';
import { isWebUrl } from '@/utils/web-url';

/** The file formats on offer. */
export type ReportFileType = 'csv' | 'xlsx';

const FORMATS: { type: ReportFileType; Icon: typeof CsvIcon }[] = [
  { type: 'xlsx', Icon: XlsxIcon },
  { type: 'csv', Icon: CsvIcon },
];

interface DownloadDrawerProps {
  defaultType: ReportFileType | null;
  disabled: boolean;
  getUrl: (type: ReportFileType) => Promise<string>;
}

/**
 * Downloads the report as a file in the columns and with the filters shown.
 *
 * Luna answers with a short-lived signed link, which the browser follows only
 * when it is a web address.
 *
 * @param props.defaultType - The format picked first: the one the question asked for, if any.
 * @param props.disabled - Whether there is nothing to download.
 * @param props.getUrl - Asks Luna for the link in a format.
 */
export function DownloadDrawer({ defaultType, disabled, getUrl }: Readonly<DownloadDrawerProps>) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportFileType>(defaultType ?? 'xlsx');

  const download = useMutation({
    mutationFn: () => getUrl(type),
    onSuccess: (url) => {
      setOpen(false);

      if (!isWebUrl(url)) {
        akNotify.error(akMT('somethingWentWrong'));

        return;
      }

      window.location.href = url;
      akNotify.success(akMT('reportModule.savedReports.downloadStarted'));
    },
    onError: unlessRateLimited((error) => {
      akNotify.error(getLunaErrorMessage(error));
    }),
  });

  return (
    <AkDrawer open={open} onOpenChange={setOpen}>
      <AkDrawerTrigger asChild>
        <AkButton
          disabled={disabled}
          loading={download.isPending}
          leftIcon={<AkIcon name="material-symbols:download" />}
          data-test-report-download
        >
          {akMT('downloadReport')}
        </AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent className="w-110 max-w-full" aria-describedby={undefined}>
        <AkDrawerHeader title={akMT('downloadReport')} closeLabel={akMT('close')} />

        <AkDrawerBody className="flex flex-col gap-3">
          <AkTypography color="textSecondary">{akMT('reportModule.aiReportDownloadHeaderText')}</AkTypography>

          <div role="radiogroup" aria-label={akMT('downloadReport')} className="flex flex-col gap-2">
            {FORMATS.map(({ type: option, Icon }) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={type === option}
                onClick={() => setType(option)}
                className={cn(
                  'flex items-center gap-3 rounded-md border px-3.5 py-2.5 text-left',
                  type === option ? 'border-primary bg-primary/5' : 'border-border hover:bg-hover-light'
                )}
              >
                <Icon className="size-8 shrink-0" />

                <span className="flex flex-col">
                  <AkTypography tag="span" fontWeight="medium">
                    {akMT('reportModule.aiReportDownload', { reportType: option })}
                  </AkTypography>

                  <AkTypography tag="span" variant="body2" color="textSecondary">
                    {option === 'xlsx'
                      ? akMT('reportModule.view.xlsxDescription')
                      : akMT('reportModule.view.csvDescription')}
                  </AkTypography>
                </span>
              </button>
            ))}
          </div>
        </AkDrawerBody>

        <AkDrawerFooter className="flex justify-end gap-2">
          <AkButton variant="outlined" color="neutral" onClick={() => setOpen(false)}>
            {akMT('cancel')}
          </AkButton>

          <AkButton loading={download.isPending} onClick={() => download.mutate()} data-test-report-download-confirm>
            {akMT('download')}
          </AkButton>
        </AkDrawerFooter>
      </AkDrawerContent>
    </AkDrawer>
  );
}
