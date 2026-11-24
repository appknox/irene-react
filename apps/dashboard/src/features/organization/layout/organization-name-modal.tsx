import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { organizationStore } from '@irene/api/stores/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkModal, AkModalBody, AkModalContent, AkModalHeader } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import OrgNameAddEditSuccess from '@irene/ui/svgs/org-name-add-edit-success.svg?react';

interface OrganizationNameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
}

/**
 * Names an organization, or renames one that is already named.
 *
 * It stays open once saved to say so, since naming an organization is done
 * once and the confirmation is the point.
 *
 * @param props.isOpen - Whether the panel is open.
 * @param props.currentName - What the organization is called, empty until it is named.
 * @param props.onClose - Called to close the panel.
 */
export function OrganizationNameModal({
  isOpen,
  currentName,
  onClose,
}: Readonly<OrganizationNameModalProps>) {
  const [name, setName] = useState(currentName);
  const [isSaved, setIsSaved] = useState(false);

  const isRename = currentName !== '';

  const rename = useMutation({
    mutationFn: (value: string) =>
      OrganizationService.renameOrganization(
        Number(organizationStore.getState().selected?.id),
        value
      ),

    onSuccess: (organization) => {
      const { selected, me } = organizationStore.getState();

      /* The name is read from the store all over the app, so the store is told. */
      if (selected && me) {
        organizationStore.getState().select({ ...selected, name: organization.name }, me);
      }

      setIsSaved(true);
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  /* Opening again after a save starts over rather than reopening on the confirmation. */
  const close = () => {
    setIsSaved(false);
    setName(currentName);
    onClose();
  };

  return (
    <AkModal open={isOpen} onOpenChange={(open) => !open && close()}>
      <AkModalContent className="max-w-125" data-test-org-name-modal>
        <AkModalHeader
          title={isRename ? akMT('organizationName') : akMT('addOrgName')}
          closeLabel={akMT('close')}
        />

        {isSaved ? (
          <AkModalBody className="flex flex-col items-center gap-3.5 p-3.5">
            <OrgNameAddEditSuccess aria-hidden="true" />

            <AkTypography data-test-org-name-saved>
              {akMT('organizationNameAddedOrUpdated', { type: isRename ? 'edit' : 'add' })}
            </AkTypography>

            <AkButton onClick={close} data-test-org-name-saved-ok>
              {akMT('ok')}
            </AkButton>
          </AkModalBody>
        ) : (
          <AkModalBody className="flex flex-col gap-3.5 p-3.5">
            <label htmlFor="organization-name">
              <AkTypography tag="span" variant="h6">
                {akMT('organizationName')}
              </AkTypography>
            </label>

            <AkInput
              id="organization-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={akMT('organizationName')}
              data-test-org-name-input
            />

            <div className="flex justify-end gap-2.5">
              <AkButton
                variant="outlined"
                color="neutral"
                disabled={rename.isPending}
                onClick={close}
              >
                {akMT('cancel')}
              </AkButton>

              <AkButton
                loading={rename.isPending}
                onClick={() => rename.mutate(name)}
                data-test-org-name-save
              >
                {akMT('save')}
              </AkButton>
            </div>
          </AkModalBody>
        )}
      </AkModalContent>
    </AkModal>
  );
}
