import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkModal, AkModalBody, AkModalContent, AkModalHeader } from '@irene/ui/ak-modal';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationCleanupPreferenceOptions, organizationKeys } from '@/queries/organization';

import { CleanupList } from './cleanup-list';
import { SettingsPanel } from './settings-panel';

/** How many of a project's recent uploads may be kept, as irene bounds the field. */
const FILES_TO_KEEP = { min: 2, max: 50 };

/* The pattern the last cleanup's date is written in, rather than one of the locale's own. */
const LAST_ACTIVITY_FORMAT = 'DD MMM YYYY';

/**
 * Whether old application binaries are cleaned up, and how many are kept.
 *
 * The section is left out altogether where the endpoint answers 404, which is
 * how it answers for an organization the feature is not set up for — irene
 * hides the whole block on that answer rather than reporting it.
 */
export function FileCleanupPanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [filesToKeep, setFilesToKeep] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);

  const preference = useQuery(organizationCleanupPreferenceOptions(selected?.id));

  const refreshPreference = () =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.cleanupPreference(selected?.id) });

  const save = useMutation({
    mutationFn: (next: { is_enabled: boolean; files_to_keep: number }) =>
      OrganizationService.setOrganizationCleanupPreference(Number(selected?.id), next),

    onSuccess: async () => {
      akNotify.success(akMT('fileCleanup.msg.saveSuccess'));
      setFilesToKeep(null);

      await refreshPreference();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('fileCleanup.msg.saveError'));
    },
  });

  const start = useMutation({
    mutationFn: () => OrganizationService.startOrganizationCleanup(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('fileCleanup.msg.triggerSuccess'));

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.cleanupsList(selected?.id),
      });

      await refreshPreference();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('fileCleanup.msg.triggerError'));
    },
  });

  /* Not set up for this organization, which the endpoint says with a 404. */
  if (getApiErrorStatus(preference.error) === HTTP_STATUS_CODES.NOT_FOUND) {
    return null;
  }

  if (!preference.data) {
    return null;
  }

  const isEnabled = preference.data.is_enabled;
  const keeping = filesToKeep ?? String(preference.data.files_to_keep);
  const keptCount = Number(keeping);

  const isOutOfBounds =
    !Number.isInteger(keptCount) || keptCount < FILES_TO_KEEP.min || keptCount > FILES_TO_KEEP.max;

  return (
    <SettingsPanel title={akMT('storageManagement')} testAttribute="org-file-cleanup">
      <div className="flex gap-3.5">
        <AkToggle
          id="auto-cleanup"
          checked={isEnabled}
          disabled={save.isPending}
          onCheckedChange={(checked) =>
            save.mutate({ is_enabled: checked, files_to_keep: preference.data.files_to_keep })
          }
          data-test-org-file-cleanup-toggle
        />

        <div className="flex flex-col gap-1">
          <AkTypography tag="h3" variant="h5" data-test-org-file-cleanup-auto-title>
            {akMT('fileCleanup.autoCleanup')}
          </AkTypography>

          <AkTypography variant="body2" data-test-org-file-cleanup-description>
            {akMT('fileCleanup.description')}
          </AkTypography>

          {isEnabled && (
            <div className="my-3.5 flex flex-col gap-3.5">
              <div className="flex w-8/12 items-end gap-3.5">
                <div className="flex w-full flex-col gap-1">
                  <AkLabel htmlFor="active-file-limit" className="font-medium">
                    {akMT('fileCleanup.activeCount')}
                  </AkLabel>

                  <AkInput
                    id="active-file-limit"
                    type="number"
                    min={FILES_TO_KEEP.min}
                    max={FILES_TO_KEEP.max}
                    value={keeping}
                    hasError={isOutOfBounds}
                    errorMessage={
                      isOutOfBounds
                        ? akMT('fileCleanup.filesToKeepError', {
                            min: FILES_TO_KEEP.min,
                            max: FILES_TO_KEEP.max,
                          })
                        : undefined
                    }
                    onChange={(event) => setFilesToKeep(event.target.value)}
                    data-test-org-file-cleanup-files-to-keep
                  />
                </div>

                <AkIconButton
                  type="button"
                  variant="outlined"
                  aria-label={akMT('save')}
                  disabled={isOutOfBounds || save.isPending}
                  onClick={() => save.mutate({ is_enabled: true, files_to_keep: keptCount })}
                  data-test-org-file-cleanup-save
                >
                  <AkIcon name="material-symbols:done" />
                </AkIconButton>
              </div>

              <div className="flex items-center gap-3.5">
                <AkTypography variant="body2" data-test-org-file-cleanup-last-activity-label>
                  {`${akMT('fileCleanup.lastActivity')}:`}
                </AkTypography>

                <AkTypography variant="body2" data-test-org-file-cleanup-last-activity>
                  {preference.data.last_cleaned_at === null
                    ? '-'
                    : dayjs(preference.data.last_cleaned_at).format(LAST_ACTIVITY_FORMAT)}
                </AkTypography>

                <AkButton
                  type="button"
                  variant="outlined"
                  onClick={() => setIsListOpen(true)}
                  data-test-org-file-cleanup-view-list
                >
                  {akMT('fileCleanup.viewList')}
                </AkButton>

                <AkButton
                  type="button"
                  loading={start.isPending}
                  onClick={() => start.mutate()}
                  data-test-org-file-cleanup-run
                >
                  {akMT('fileCleanup.run')}
                </AkButton>
              </div>
            </div>
          )}
        </div>
      </div>

      <AkModal open={isListOpen} onOpenChange={setIsListOpen}>
        <AkModalContent className="w-200 max-w-full" data-test-org-file-cleanup-modal>
          <AkModalHeader title={akMT('fileCleanup.listTitle')} closeLabel={akMT('close')} />

          <AkModalBody noGutter>
            <CleanupList />
          </AkModalBody>
        </AkModalContent>
      </AkModal>
    </SettingsPanel>
  );
}
