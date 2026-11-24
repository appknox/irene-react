import { useQuery } from '@tanstack/react-query';

import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

interface MemberIdentityProps {
  userId: number;
  field: 'username' | 'email';

  /** Marks a member the organization has deactivated, beside their name. */
  isActive?: boolean;
}

/**
 * Names a member, or gives their address.
 *
 * A membership carries only the member's id, so the account behind it is read
 * here. Nothing is drawn until it arrives, so a row reads as blank rather than
 * as a placeholder waiting to be filled.
 *
 * @param props.userId - The member to read.
 * @param props.field - Which of their details to show.
 */
export function MemberIdentity({
  userId,
  field,
  isActive = true,
}: Readonly<MemberIdentityProps>) {
  const { selected } = useOrganization();
  const { data: user } = useQuery(organizationUserOptions(selected?.id, userId));

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5">
      <AkTypography tag="span" noWrap title={user[field]} data-test-member-identity={field}>
        {user[field]}
      </AkTypography>

      {!isActive && (
        <AkChip
          label={akMT('chipStatus.inactive')}
          size="small"
          variant="semi-filled"
          data-test-member-inactive
        />
      )}
    </div>
  );
}
