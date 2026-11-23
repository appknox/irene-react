import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  StoreknoxService,
  type ApiSkAppVersion,
  type ApiSkInventoryApp,
} from '@irene/api/services/storeknox';

import { patchPaginationItem } from '@irene/api/normalization';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';
import type { ApiPage } from '@irene/api/utils/pagination';

import { useTrackedSubmission } from '@/features/storeknox/hooks/use-tracked-submission';
import { skFileOptions, storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { isReadOnly } from '@/features/storeknox/utils/sk-app';
import { skSubmissionFailed, skSubmissionIsAnalyzing } from '@/features/storeknox/utils/submission';

/** One store version's upload and its file, as irene's version actions cell keeps them. */
export function useVersionUpload(version: ApiSkAppVersion, app: ApiSkInventoryApp) {
  const queryClient = useQueryClient();
  const [showAppUploadState, setShowAppUploadState] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const file = useQuery({
    ...skFileOptions(version.file ?? ''),
    enabled: version.file !== null,
  });

  const tracked = useTrackedSubmission(version.upload_submission, (moved) => {
    setModalOpen(false);

    if (skSubmissionIsAnalyzing(moved)) {
      /* As irene's `doReloadSkAppVersion`: the versions and the app, not the upload just pushed. */
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.appVersionsOf(app.id) });
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.inventoryApp(app.id) });
    }
  });

  const readOnly = isReadOnly(app);

  const initiate = useMutation({
    mutationFn: async () => {
      const reloaded = await StoreknoxService.getAppVersion(version.id);

      /* Patches every cached page holding the version, as irene's `skAppVersion.reload()`. */
      queryClient.setQueriesData<ApiPage<ApiSkAppVersion>>(
        { queryKey: storeknoxKeys.appVersionsOf(app.id) },
        (page) => patchPaginationItem(page, version.id, reloaded)
      );

      if (!reloaded.can_initiate_upload) {
        /* Another member started a re-upload while this page was open. */
        tracked.refetch();
        setModalOpen((open) => !open);
        akNotify.error(akMT('storeknox.initiateUploadMessages.cannotIntiateUploadForVersion'));

        return;
      }

      const started = await StoreknoxService.initiateAppVersionUpload(version.id);

      tracked.follow(started.id);
      setShowAppUploadState(true);
      setModalOpen(false);
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  const { submission, userCanAccessSubmission } = tracked;
  const canInitiateUpload = version.can_initiate_upload;
  const failed = skSubmissionFailed(submission);
  const uploadIsInProgressForNonInitiator = !userCanAccessSubmission && !canInitiateUpload;

  return {
    submission,
    userCanAccessSubmission,
    canInitiateUpload,
    submissionErrorMessage: version.submission_error_message,
    readOnly,
    modalOpen,
    setModalOpen,
    isLoading: tracked.isLoading || (version.file !== null && file.isPending),
    isInitiating: initiate.isPending,
    submissionFailed: failed,
    uploadIncomplete: (userCanAccessSubmission && failed) || uploadIsInProgressForNonInitiator,
    fileIsBeingAnalyzed: userCanAccessSubmission && skSubmissionIsAnalyzing(submission),
    appIsAnalyzing: skSubmissionIsAnalyzing(submission),
    showNoActionText: !showAppUploadState && version.file !== null,
    showUploadedAppCurrentStatus:
      uploadIsInProgressForNonInitiator ||
      (userCanAccessSubmission && Boolean(submission)) ||
      showAppUploadState,
    initiateUpload: () => {
      if (!readOnly) {
        initiate.mutate();
      }
    },
  };
}
