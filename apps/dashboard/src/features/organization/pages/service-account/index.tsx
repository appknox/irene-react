import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';

import { ServiceAccountService, type ApiServiceAccount } from '@irene/api/services/service-account';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkLabel } from '@irene/ui/ak-label';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { useUrlState } from '@/hooks/use-url-state';
import { serviceAccountKeys, serviceAccountsOptions } from '@/queries/service-account';

import { buildServiceAccountColumns } from './columns';
import { ConfirmDrawer } from './components/confirm-drawer';

/** The page sizes irene offers on this list. */
const PAGE_SIZES = [10, 25, 50];

/* The query parameters irene keeps this list in, so a link to one still works. */
const SERVICE_ACCOUNTS_URL_STATE = {
  sa_limit: PAGE_SIZES[0] ?? 10,
  sa_offset: 0,
  show_system_created: false,
  show_cli_enabled: false,
};

/** Nothing made yet, which irene draws in place of the table. */
function NoServiceAccounts() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.75 px-7 py-12.25"
      data-test-service-accounts-empty
    >
      <ProjectListEmpty aria-hidden="true" />

      <AkTypography tag="h3" variant="h5" className="mt-7">
        {akMT('serviceAccountModule.emptyTitle')}
      </AkTypography>

      <AkTypography className="text-center">
        <AkMessageTranslate id="serviceAccountModule.emptyDescription" />
      </AkTypography>
    </div>
  );
}

/**
 * The accounts an organization issues to its own systems.
 *
 * The page and the two filters live in the address under the names irene's
 * route gives them, so a reload opens the list where it was left.
 */
export function OrganizationServiceAccountPage() {
  const queryClient = useQueryClient();

  const [urlState, changeUrlState] = useUrlState(SERVICE_ACCOUNTS_URL_STATE);

  const [accountToDelete, setAccountToDelete] = useState<ApiServiceAccount | null>(null);

  const accounts = useQuery(
    serviceAccountsOptions({
      limit: urlState.sa_limit,
      offset: urlState.sa_offset,
      showSystemCreated: urlState.show_system_created,
      showCliEnabled: urlState.show_cli_enabled,
    })
  );

  const columns = useMemo(() => buildServiceAccountColumns(setAccountToDelete), []);

  const remove = useMutation({
    mutationFn: (serviceAccount: ApiServiceAccount) =>
      ServiceAccountService.deleteServiceAccount(serviceAccount.id),

    onSuccess: async () => {
      akNotify.success(akMT('serviceAccountModule.deleteSuccessMsg'));
      setAccountToDelete(null);

      await queryClient.invalidateQueries({ queryKey: serviceAccountKeys.list() });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const rows = accounts.data?.items ?? [];
  const totalItems = accounts.data?.count ?? 0;
  const isLoading = accounts.isPending || accounts.isPlaceholderData;

  return (
    <Fragment>
      <div className="mt-5.25 border border-border bg-background" data-test-service-accounts>
        <div className="flex items-center justify-between gap-2.75 p-3.5">
          <div className="flex flex-col gap-1">
            <AkTypography tag="h2" variant="subtitle1" data-test-service-accounts-title>
              {akMT('serviceAccountModule.listTitle')}
            </AkTypography>

            <AkTypography
              variant="body2"
              color="textSecondary"
              data-test-service-accounts-description
            >
              {akMT('serviceAccountModule.listDescription')}
            </AkTypography>
          </div>

          <div className="flex items-center gap-4.5">
            <div className="flex items-center gap-1.75">
              <AkCheckbox
                id="show-system-created"
                checked={urlState.show_system_created}
                onCheckedChange={(checked) =>
                  changeUrlState({ show_system_created: checked === true, sa_offset: 0 })
                }
                data-test-service-accounts-system-created
              />

              <AkLabel htmlFor="show-system-created">
                {akMT('serviceAccountModule.showSystemCreated')}
              </AkLabel>
            </div>

            <div className="flex items-center gap-1.75">
              <AkCheckbox
                id="show-cli-enabled"
                checked={urlState.show_cli_enabled}
                onCheckedChange={(checked) =>
                  changeUrlState({ show_cli_enabled: checked === true, sa_offset: 0 })
                }
                data-test-service-accounts-cli-enabled
              />

              <AkLabel htmlFor="show-cli-enabled">
                {akMT('serviceAccountModule.showCliEnabled')}
              </AkLabel>
            </div>

            {/* 34px of hairline, as irene sets the filters off from the control. */}
            <span className="h-8.5 w-px bg-neutral-300" />

            <AkButton asChild data-test-service-accounts-create>
              <a href={`${ORGANIZATION_SETTINGS_TABS.serviceAccount}/create`}>{akMT('create')}</a>
            </AkButton>
          </div>
        </div>

        {isLoading && (
          <Fragment>
            <AkDivider color="dark" />

            <TableSkeleton columns={columns} rows={5} caption={akMT('serviceAccount')} />
          </Fragment>
        )}

        {!isLoading && totalItems === 0 && (
          <Fragment>
            <AkDivider color="dark" />

            <NoServiceAccounts />
          </Fragment>
        )}

        {!isLoading && totalItems > 0 && (
          <Fragment>
            <div className="mb-3.5">
              <AkTable
                columns={columns}
                data={rows}
                caption={akMT('serviceAccountModule.listTitle')}
                getRowId={(serviceAccount) => String(serviceAccount.id)}
                data-test-service-accounts-table
              />
            </div>

            <AkPagination
              totalItems={totalItems}
              limit={urlState.sa_limit}
              offset={urlState.sa_offset}
              itemPerPageOptions={PAGE_SIZES}
              onPageChange={({ limit, offset }) =>
                changeUrlState({ sa_limit: limit, sa_offset: offset })
              }
              onItemPerPageChange={({ limit }) => changeUrlState({ sa_limit: limit, sa_offset: 0 })}
              tableItemLabel={akMT('serviceAccount')}
              perPageLabel={akMT('recordPerPage')}
            />
          </Fragment>
        )}
      </div>

      <ConfirmDrawer
        isOpen={accountToDelete !== null}
        confirmText={akMT('delete')}
        isWorking={remove.isPending}
        onConfirm={() => accountToDelete && remove.mutate(accountToDelete)}
        onCancel={() => setAccountToDelete(null)}
      >
        {accountToDelete && (
          <AkTypography data-test-service-accounts-delete-question>
            <AkMessageTranslate
              id="serviceAccountModule.deleteConfirmText"
              values={{ name: accountToDelete.name }}
            />
          </AkTypography>
        )}
      </ConfirmDrawer>
    </Fragment>
  );
}
