import { useQuery } from '@tanstack/react-query';

import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

interface MemberNameProps {
  userId: number | null;
}

/**
 * Names the member a namespace record refers to by id.
 *
 * Nothing is drawn until the name is known, and nothing where the record names
 * no one, so the row reads as a date alone rather than as a date followed by a
 * gap waiting to be filled.
 *
 * @param props.userId - The member to name, absent on a record that names none.
 */
export function MemberName({ userId }: Readonly<MemberNameProps>) {
  const { selected } = useOrganization();
  const { data: member } = useQuery(organizationUserOptions(selected?.id, userId));

  if (!member) {
    return null;
  }

  return (
    <>
      <AkTypography tag="span" color="textSecondary">
        {akMT('by')}
      </AkTypography>

      <AkTypography tag="span" data-test-namespace-member>
        {member.username}
      </AkTypography>
    </>
  );
}
