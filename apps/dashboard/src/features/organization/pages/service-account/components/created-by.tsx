import { useQuery } from '@tanstack/react-query';

import { AkTypography } from '@irene/ui/ak-typography';
import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

interface CreatedByProps {
  /** The account that made it, as the service account carries them: an id alone. */
  userId: number | null;
}

/**
 * Who made a service account.
 *
 * The list sends the maker's id alone, so the name is read through it, as the
 * team and member lists read theirs.
 *
 * @param props.userId - The maker, or nothing where the system made it.
 */
export function CreatedBy({ userId }: Readonly<CreatedByProps>) {
  const { selected } = useOrganization();

  const user = useQuery(organizationUserOptions(selected?.id, userId));

  const username = user.data?.username ?? '';

  return (
    <AkTypography noWrap title={username} data-test-service-account-created-by>
      {username}
    </AkTypography>
  );
}
