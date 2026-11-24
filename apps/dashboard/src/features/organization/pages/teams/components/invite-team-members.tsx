import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

import { TeamActionFooter } from './team-action-footer';

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

interface InviteTeamMembersProps {
  team: ApiOrganizationTeam;
  onDone: () => void;
}

/**
 * Invites people into a team.
 *
 * Several addresses at once, sent one at a time as irene sends them, so one
 * refusal does not take the rest down with it. Whoever accepts joins the
 * organization and this team together.
 *
 * @param props.team - The team to invite them into.
 * @param props.onDone - Called to leave the pane.
 */
export function InviteTeamMembers({ team, onDone }: Readonly<InviteTeamMembersProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const emails = readEmails(text);

  const invite = useMutation({
    mutationFn: async (addresses: string[]) => {
      for (const email of addresses) {
        await OrganizationService.inviteToOrganizationTeam(
          organization.selectedId(),
          team.id,
          email
        );
      }
    },

    onSuccess: async () => {
      akNotify.success(akMT('orgMemberInvited'));
      setText('');
      setError('');
      onDone();

      /* An invitation changes only what this team is waiting on. */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.teamRecords(organization.selected?.id, team.id, 'invitations'),
        }),
      ]);
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
    /*
      Fills what the drawer's header leaves, and may shrink below its own
      content, so what scrolls inside it scrolls rather than pushing the
      footer past the bottom of the panel.
    */
    <div className="flex min-h-0 flex-1 flex-col" data-test-invite-team-members>
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 p-5.25">
        <label htmlFor="team-invite-emails" className="flex flex-col gap-1">
          <AkTypography tag="span" variant="subtitle1">
            {akMT('email')}
          </AkTypography>

          <AkTypography tag="span" variant="body2" color="textSecondary">
            {akMT('inviteUserMultipleEmailHelperText')}
          </AkTypography>
        </label>

        <AkInput
          id="team-invite-emails"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={akMT('email')}
          errorMessage={error}
          autoFocus
          data-test-team-invite-emails
        />

        {emails.length > 0 && (
          <div className="flex flex-wrap gap-3.5">
            {emails.map((email, index) => (
              <AkChip
                key={email}
                label={email}
                variant="outlined"
                onDelete={() => removeEmail(index)}
                data-test-team-invite-chip
              />
            ))}
          </div>
        )}
      </div>

      <TeamActionFooter
        actionLabel={akMT('invite')}
        isWorking={invite.isPending}
        onAction={send}
        onBack={onDone}
      />
    </div>
  );
}
