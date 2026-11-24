import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

/** The addresses typed, as irene reads them: separated by commas, blanks dropped. */
const readEmails = (text: string) =>
  text
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

/* An address the server will accept: something, an at sign, a dotted domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The addresses that are worth sending, as irene sends only the valid ones. */
const sendableEmails = (text: string) =>
  readEmails(text.replace(/[\n\t ]/g, '')).filter((email) => EMAIL_PATTERN.test(email));

/**
 * Invites people into the organization.
 *
 * Several addresses at once, sent one at a time as irene sends them, so one
 * refusal does not take the rest down with it.
 */
export function InviteUsers() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const emails = readEmails(text);

  const invite = useMutation({
    mutationFn: async (addresses: string[]) => {
      for (const email of addresses) {
        await OrganizationService.inviteToOrganization(Number(selected?.id), email);
      }
    },

    onSuccess: async () => {
      akNotify.success(akMT('orgMemberInvited'));
      setIsOpen(false);
      setText('');
      setError('');

      /* The addresses join the invitations this organization is waiting on. */
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.invitationsList(selected?.id),
      });
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  /* An address that cannot be sent to is said so under the field, where it was typed. */
  const send = () => {
    const sendable = sendableEmails(text);

    if (sendable.length === 0) {
      setError(akMT('emptyEmailId'));

      return;
    }

    setError('');
    invite.mutate(sendable);
  };

  /* Removing one rewrites the field, which is where the addresses are held. */
  const removeEmail = (index: number) =>
    setText(emails.filter((_, position) => position !== index).join(', '));

  return (
    <AkDrawer open={isOpen} onOpenChange={setIsOpen}>
      <AkDrawerTrigger asChild>
        <AkButton data-test-invite-users>
          <AkIcon name="material-symbols:group-add" />

          {akMT('inviteUsers')}
        </AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent className="w-125" data-test-invite-users-drawer>
        <AkDrawerHeader title={akMT('inviteUsers')} closeLabel={akMT('close')} />

        <AkDrawerBody className="flex flex-col gap-3.5">
          <label htmlFor="invite-emails" className="flex flex-col gap-1">
            <AkTypography tag="span" variant="subtitle1">
              {akMT('email')}
            </AkTypography>

            <AkTypography tag="span" variant="body2" color="textSecondary">
              {akMT('inviteUserMultipleEmailHelperText')}
            </AkTypography>
          </label>

          <AkInput
            id="invite-emails"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={akMT('email')}
            errorMessage={error}
            autoFocus
            data-test-invite-emails
          />

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-3.5">
              {emails.map((email, index) => (
                <AkChip
                  key={email}
                  label={email}
                  variant="outlined"
                  onDelete={() => removeEmail(index)}
                  data-test-invite-email-chip
                />
              ))}
            </div>
          )}
        </AkDrawerBody>

        <AkDrawerFooter className="flex-row items-center justify-end gap-2.5">
          <AkButton
            variant="outlined"
            color="neutral"
            disabled={invite.isPending}
            onClick={() => setIsOpen(false)}
          >
            {akMT('cancel')}
          </AkButton>

          <AkButton loading={invite.isPending} onClick={send} data-test-invite-send>
            {akMT('invite')}
          </AkButton>
        </AkDrawerFooter>
      </AkDrawerContent>
    </AkDrawer>
  );
}
