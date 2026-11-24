import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState, type FormEvent } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkModal, AkModalBody, AkModalContent, AkModalHeader } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

/**
 * Starts a team.
 *
 * Only an administrator may, so the caller decides whether to render it.
 */
export function CreateTeam() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const createTeam = useMutation({
    mutationFn: (teamName: string) =>
      OrganizationService.createOrganizationTeam(Number(selected?.id), teamName),

    onSuccess: async () => {
      akNotify.success(akMT('teamCreated'));
      setIsOpen(false);
      setName('');

      await queryClient.invalidateQueries({ queryKey: organizationKeys.all() });
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  /* irene refuses an empty name before asking the server. */
  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (name.trim() === '') {
      akNotify.error(akMT('enterTeamName'));

      return;
    }

    createTeam.mutate(name.trim());
  };

  return (
    <Fragment>
      <AkButton onClick={() => setIsOpen(true)} data-test-create-team>
        <AkIcon name="material-symbols:groups" />

        {akMT('createTeam')}
      </AkButton>

      <AkModal open={isOpen} onOpenChange={setIsOpen}>
        <AkModalContent className="max-w-125" data-test-create-team-modal>
          <AkModalHeader title={akMT('createTeam')} closeLabel={akMT('close')} />

          <AkModalBody>
            <form className="flex flex-col" onSubmit={submit}>
              <label htmlFor="create-team-name">
                <AkTypography tag="span" variant="h6">
                  {akMT('createTeamInputLabel')}
                </AkTypography>
              </label>

              <AkInput
                id="create-team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={akMT('teamName')}
                className="mt-1.5"
                autoFocus
                data-test-create-team-input
              />

              <AkButton
                type="submit"
                className="mt-5.25 self-start"
                loading={createTeam.isPending}
                data-test-create-team-submit
              >
                {akMT('createTeam')}
              </AkButton>
            </form>
          </AkModalBody>
        </AkModalContent>
      </AkModal>
    </Fragment>
  );
}
