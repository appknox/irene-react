import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import {
  AkMenu,
  AkMenuContent,
  AkMenuItem,
  AkMenuSeparator,
  AkMenuTrigger,
} from '@irene/ui/ak-menu';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import OverrideDetails from '@irene/ui/svgs/override-details.svg?react';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';

interface ServiceAccountActionsProps {
  serviceAccount: ApiServiceAccount;
  onDelete: (serviceAccount: ApiServiceAccount) => void;
}

/**
 * What a row offers: the way into the account, and the menu that withdraws it.
 *
 * @param props.serviceAccount - The account this row is about.
 * @param props.onDelete - Opens the question asked before the account is withdrawn.
 */
export function ServiceAccountActions({
  serviceAccount,
  onDelete,
}: Readonly<ServiceAccountActionsProps>) {
  return (
    <div className="flex items-center justify-center gap-1.75">
      <Link
        to={`${ORGANIZATION_SETTINGS_TABS.serviceAccount}/$serviceAccountId`}
        params={{ serviceAccountId: String(serviceAccount.id) }}
        title={akMT('viewDetails')}
        aria-label={`${akMT('viewDetails')} ${serviceAccount.name}`}
        className="inline-flex items-center justify-center rounded-xs p-1.5 hover:bg-hover-light"
        data-test-service-account-details
      >
        <OverrideDetails aria-hidden="true" className="size-4" />
      </Link>

      {/* irene rules the two apart with a 22px hairline of its own, not a divider. */}
      <span className="h-5.5 w-px bg-neutral-300" />

      <AkMenu>
        <AkMenuTrigger asChild>
          <AkIconButton
            title={akMT('moreOptions')}
            aria-label={`${akMT('moreOptions')} ${serviceAccount.name}`}
            data-test-service-account-more
          >
            <AkIcon name="material-symbols:more-vert" />
          </AkIconButton>
        </AkMenuTrigger>

        <AkMenuContent align="end" arrow>
          <Fragment>
            <AkMenuItem asChild data-test-service-account-duplicate>
              <Link
                to={`${ORGANIZATION_SETTINGS_TABS.serviceAccount}/create`}
                search={{ duplicate: serviceAccount.id }}
              >
                {akMT('serviceAccountModule.duplicate')}
              </Link>
            </AkMenuItem>

            <AkMenuSeparator />

            <AkMenuItem onSelect={() => onDelete(serviceAccount)} data-test-service-account-delete>
              {akMT('delete')}
            </AkMenuItem>
          </Fragment>
        </AkMenuContent>
      </AkMenu>
    </div>
  );
}
