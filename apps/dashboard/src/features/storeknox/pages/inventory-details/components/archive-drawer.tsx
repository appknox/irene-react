import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { StoreknoxService, type ApiSkInventoryApp } from '@irene/api/services/storeknox';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerClose, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import { akNotify } from '@irene/ui/notify';

import { skInventoryAppOptions, storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { isArchived } from '@/features/storeknox/utils/sk-app';

interface ArchiveDrawerProps {
  app: ApiSkInventoryApp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirms archiving or restoring an app; archiving starts a six-month lock, whose end date the note gives. */
export function ArchiveDrawer({ app, open, onOpenChange }: Readonly<ArchiveDrawerProps>) {
  const queryClient = useQueryClient();
  const archived = isArchived(app);

  const toggleArchive = useMutation({
    mutationFn: () => StoreknoxService.toggleArchiveStatus(app),
    onSuccess: async () => {
      await queryClient.query({ ...skInventoryAppOptions(app.id), staleTime: 0 });
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });

      onOpenChange(false);

      akNotify.success(
        archived
          ? akMT('storeknox.appUnarchivedSuccessfully')
          : akMT('storeknox.appArchivedSuccessfully')
      );
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  const appTitle = app.app_metadata.title;

  return (
    <AkDrawer open={open} onOpenChange={onOpenChange}>
      <AkDrawerContent className="w-125 max-w-full" data-test-sk-archive-drawer>
        <AkDrawerHeader title={akMT('confirmation')} closeLabel={akMT('close')} />

        <div className="flex flex-col px-6 py-4">
          <AkTypography className={cn(!archived && 'mb-6')}>
            {archived
              ? akMT('storeknox.unarchiveLockPeriodMessage', { appTitle })
              : akMT('storeknox.archiveLockPeriodMessage', { appTitle })}
          </AkTypography>

          {!archived && (
            <AkTypography>
              {akMT('storeknox.archiveLockPeriodNote', {
                date: formatDateTime(dayjs().add(6, 'month').toDate(), 'mediumDate'),
              })}
            </AkTypography>
          )}
        </div>

        <AkDivider color="dark" />

        <div className="flex items-center gap-3 p-4">
          <AkButton loading={toggleArchive.isPending} onClick={() => toggleArchive.mutate()}>
            {akMT('yes')}, {archived ? akMT('storeknox.unarchive') : akMT('storeknox.archive')}
          </AkButton>

          <AkDrawerClose asChild>
            <AkButton variant="outlined" color="neutral" disabled={toggleArchive.isPending}>
              {akMT('cancel')}
            </AkButton>
          </AkDrawerClose>
        </div>
      </AkDrawerContent>
    </AkDrawer>
  );
}
