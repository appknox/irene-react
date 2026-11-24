import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiOrganizationMembership } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

/* The roles an organization has, named as irene names them rather than by the server's wording. */
const ROLE_LABELS: Record<number, () => string> = {
  [ENUMS.ORGANIZATION_ROLES.MEMBER]: () => akMT('memberRole'),
  [ENUMS.ORGANIZATION_ROLES.OWNER]: () => akMT('owner'),
  [ENUMS.ORGANIZATION_ROLES.ADMIN]: () => akMT('admin'),
};

const ROLES = [
  ENUMS.ORGANIZATION_ROLES.MEMBER,
  ENUMS.ORGANIZATION_ROLES.ADMIN,
  ENUMS.ORGANIZATION_ROLES.OWNER,
];

interface MemberRoleProps {
  member: ApiOrganizationMembership;

  /** Where the control sits in the space it is given: centred in a column of its own, or beside a label. */
  align?: 'center' | 'start';
}

/**
 * What a member may do, and for an owner the way to change it.
 *
 * Anyone else reads it. A deactivated member's role is left as it is, since
 * changing what a dormant account may do decides nothing.
 *
 * @param props.member - The membership whose role this is.
 * @param props.align - Where the control sits, centred in its own column by default.
 */
export function MemberRole({ member, align = 'center' }: Readonly<MemberRoleProps>) {
  const queryClient = useQueryClient();
  const { selected, me } = useOrganization();

  const setRole = useMutation({
    mutationFn: (role: number) =>
      OrganizationService.setOrganizationMemberRole(Number(selected?.id), member.member, role),

    onSuccess: async () => {
      akNotify.success(akMT('userRoleUpdated'));

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.membersList(selected?.id),
      });
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  if (!me?.is_owner) {
    return (
      <AkTypography tag="span" noWrap data-test-member-role>
        {ROLE_LABELS[member.role]?.() ?? member.role_display}
      </AkTypography>
    );
  }

  return (
    <div
      className={cn('flex', align === 'center' ? 'justify-center' : 'justify-start')}
      data-test-member-role-select
    >
      <AkSelect
        value={String(member.role)}
        disabled={!member.is_active || setRole.isPending}
        onValueChange={(value) => setRole.mutate(Number(value))}
      >
        <AkSelectTrigger size="sm" aria-label={akMT('role')} className="w-30 bg-background">
          <AkSelectValue />
        </AkSelectTrigger>

        <AkSelectContent>
          {ROLES.map((role) => (
            <AkSelectItem key={role} value={String(role)}>
              {ROLE_LABELS[role]?.()}
            </AkSelectItem>
          ))}
        </AkSelectContent>
      </AkSelect>
    </div>
  );
}
