import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { StoreknoxService, type ApiSkInventoryApp } from '@irene/api/services/storeknox';
import { getApiErrorStatus, unlessRateLimited } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import {
  skFileOptions,
  skInventoryAppOptions,
  storeknoxKeys,
} from '@/features/storeknox/queries/inventory';

import { useTrackedSubmission } from '@/features/storeknox/hooks/use-tracked-submission';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { isReadOnly } from '@/features/storeknox/utils/sk-app';
import { skSubmissionProgress } from '@/features/storeknox/utils/submission';

/** Which panel the scan results section shows. */
export type VaResultsPanel = 'loading' | 'inaccessible' | 'progress' | 'latest-file' | 'initiate';

/**
 * The state behind an app's latest scan results, as irene's `VaResults` keeps it.
 * The file is fetched rather than read off the app, since a 404 is how the page
 * learns the account cannot see it.
 */
export function useVaResults(app: ApiSkInventoryApp) {
  const queryClient = useQueryClient();
  const fileId = app.core_project_latest_version;

  const file = useQuery({ ...skFileOptions(fileId ?? ''), enabled: fileId !== null });

  const reloadApp = async () => {
    const reloaded = await queryClient.query({
      ...skInventoryAppOptions(app.id),
      staleTime: 0,
    });

    /* The app may now point at a newer file, so every cached file and its counts are refreshed. */
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: storeknoxKeys.files() }),
      queryClient.invalidateQueries({ queryKey: storeknoxKeys.fileRisks() }),
    ]);

    return reloaded;
  };

  const tracked = useTrackedSubmission(app.upload_submission, () => void reloadApp());
  const { submission } = tracked;

  const initiate = useMutation({
    mutationFn: async () => {
      /* Another member may have started an upload while this page was open. */
      const reloaded = await reloadApp();

      if (!reloaded.can_initiate_upload) {
        tracked.refetch();
        akNotify.error(akMT('storeknox.initiateUploadMessages.cannotIntiateUpload'));

        return;
      }

      const started = await StoreknoxService.initiateAppUpload(app.id);

      tracked.follow(started.id);
      await reloadApp();
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  const initiateUpload = () => {
    if (isReadOnly(app)) {
      akNotify.error(akMT('storeknox.initiateUploadMessages.cannotIntiateUpload'));

      return;
    }

    initiate.mutate();
  };

  const progress = skSubmissionProgress(submission);
  const uploadNotStarted = submission?.status === ENUMS.SUBMISSION_STATUS.STORE_NOT_STARTED;
  const showsProgress = uploadNotStarted || progress !== undefined;

  const panel = _choosePanel({
    isLoading: (fileId !== null && file.isPending) || tracked.isLoading,
    fileInaccessible: getApiErrorStatus(file.error) === HTTP_STATUS_CODES.NOT_FOUND,
    showsProgress,
    hasLatestFile: fileId !== null,
  });

  return {
    panel,
    file: file.data,
    submission,
    progress,
    uploadNotStarted,
    userCanAccessSubmission: tracked.userCanAccessSubmission,
    isInitiating: initiate.isPending,
    initiateUpload,
  };
}

/** irene's order: loading, then no access, then an upload in flight, then the file, else the way to upload. */
function _choosePanel(state: {
  isLoading: boolean;
  fileInaccessible: boolean;
  showsProgress: boolean;
  hasLatestFile: boolean;
}): VaResultsPanel {
  if (state.isLoading) {
    return 'loading';
  }

  if (state.fileInaccessible) {
    return 'inaccessible';
  }

  if (state.showsProgress) {
    return 'progress';
  }

  return state.hasLatestFile ? 'latest-file' : 'initiate';
}
