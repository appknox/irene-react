import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Fragment } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

/* The pattern the audit is written in, rather than one of the locale's own. */
const AUDIT_MOMENT_FORMAT = 'MMMM DD, YYYY, hh:mm';

/** One line of the audit: when something happened, or who did it. */
interface AuditLine {
  title: string;
  value: string;
  isWho: boolean;

  /** Whether the name is still being read, which stands in for it meanwhile. */
  isLoading?: boolean;
}

/**
 * Who made the account and when, and who last changed it.
 *
 * Read behind the mark beside the account's name, as irene tucks it there
 * rather than spending the section's room on it.
 *
 * @param props.serviceAccount - The account the audit is of.
 */
export function AuditInfo({ serviceAccount }: Readonly<{ serviceAccount: ApiServiceAccount }>) {
  const { selected } = useOrganization();

  const createdBy = useQuery(organizationUserOptions(selected?.id, serviceAccount.created_by_user));

  const updatedBy = useQuery(organizationUserOptions(selected?.id, serviceAccount.updated_by_user));

  const writeWho = (user?: { username: string; email: string }) =>
    user ? `${user.username} (${user.email})` : '';

  const lines: AuditLine[] = [
    {
      title: akMT('createdOn').toUpperCase(),
      value: dayjs(serviceAccount.created_on).format(AUDIT_MOMENT_FORMAT),
      isWho: false,
    },
    {
      title: akMT('createdBy').toUpperCase(),
      value: writeWho(createdBy.data),
      isWho: true,
      isLoading: createdBy.isPending,
    },

    ...(serviceAccount.updated_by_user
      ? [
          {
            title: akMT('updatedOn').toUpperCase(),
            value: dayjs(serviceAccount.updated_on).format(AUDIT_MOMENT_FORMAT),
            isWho: false,
          },
          {
            title: akMT('updatedBy').toUpperCase(),
            value: writeWho(updatedBy.data),
            isWho: true,
            isLoading: updatedBy.isPending,
          },
        ]
      : []),
  ];

  return (
    <AkTooltip
      arrow
      color="light"
      side="right"
      align="start"
      sideOffset={4}
      className="max-w-none whitespace-nowrap"
      title={
        <div className="flex flex-col">
          {lines.map((line, index) => (
            <Fragment key={line.title}>
              <div className="flex flex-col gap-1.75 p-3.5">
                <AkTypography
                  tag="h6"
                  variant="body3"
                  fontWeight="medium"
                  color="textSecondary"
                  data-test-service-account-audit-title={line.title}
                >
                  {line.title}
                </AkTypography>

                {line.isLoading && <AkSkeleton width="150px" />}

                {!line.isLoading && (
                  <div className="flex items-center gap-1.75">
                    <AkIcon
                      name={line.isWho ? 'material-symbols:info' : 'material-symbols:check-circle'}
                      className={line.isWho ? 'size-4 text-neutral-300' : 'size-4 text-success'}
                      aria-hidden
                    />

                    <AkTypography
                      tag="span"
                      fontWeight="medium"
                      color={line.isWho ? 'textPrimary' : 'success'}
                      data-test-service-account-audit-value={line.title}
                    >
                      {line.value}
                    </AkTypography>
                  </div>
                )}
              </div>

              {index < lines.length - 1 && <AkDivider color="dark" />}
            </Fragment>
          ))}
        </div>
      }
    >
      <AkIcon
        name="material-symbols:info"
        aria-label={akMT('createdBy')}
        className="size-4 text-neutral-300"
        data-test-service-account-audit
      />
    </AkTooltip>
  );
}
