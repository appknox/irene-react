import { useMutation, useQueryClient } from '@tanstack/react-query';

import { StoreknoxService, type ApiSkApp } from '@irene/api/services/storeknox';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { akNotify } from '@irene/ui/notify';

import { storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { canUnarchive } from '@/features/storeknox/utils/sk-app';

interface UnarchiveCellProps {
  app?: ApiSkApp;
  onUnarchived: () => void;
}

/**
 * Restores an archived app once its lock period has passed; until then the tooltip gives the date
 * it ends. The click stops at the button so it never also opens the row.
 *
 * @param props.app - Absent while its row loads.
 * @param props.onUnarchived - Called once the app is restored, to return the list to its first page.
 */
export function UnarchiveCell({ app, onUnarchived }: Readonly<UnarchiveCellProps>) {
  const queryClient = useQueryClient();

  const unarchive = useMutation({
    mutationFn: (archived: ApiSkApp) => StoreknoxService.toggleArchiveStatus(archived),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });
      onUnarchived();
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  if (!app) {
    return <AkSkeleton width="2em" height="2em" />;
  }

  const isDisabled = !canUnarchive(app) || unarchive.isPending;

  return (
    <AkTooltip
      disabled={!isDisabled}
      arrow
      side="left"
      title={`${akMT('storeknox.unarchiveDisabled')} ${formatDateTime(app.unarchive_available_on, 'mediumDate')}.`}
    >
      <span className="inline-flex items-center">
        <AkIconButton
          size="medium"
          aria-label={akMT('storeknox.unarchive')}
          disabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation();
            unarchive.mutate(app);
          }}
        >
          <AkIcon name="material-symbols:unarchive" />
        </AkIconButton>

        {unarchive.isPending && <AkSpinner className="ml-1 size-3.25" />}
      </span>
    </AkTooltip>
  );
}
