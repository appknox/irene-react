import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { ApiOrganizationNamespace } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { akNotify } from '@irene/ui/notify';

import { TableSkeleton } from '@/components/table-skeleton';
import { useOrganization } from '@/hooks/use-organization';
import { useUrlState } from '@/hooks/use-url-state';
import { organizationKeys, organizationNamespacesOptions } from '@/queries/organization';

import { buildNamespaceColumns } from './columns';
import { NamespacesEmpty } from './components/namespaces-empty';

/* The page sizes irene offers here, rather than the design system's own. */
const PAGE_SIZES = [10, 25, 50];

/* The query parameters irene keeps this list in, so a link to one still works. */
const NAMESPACES_URL_STATE = {
  namespace_limit: PAGE_SIZES[0],
  namespace_offset: 0,
};

/**
 * The namespaces an organization has claimed, and their standing.
 *
 * An owner approves or rejects a request from the table; anyone else reads it.
 * Rejecting removes the namespace, so it is confirmed first.
 */
export function OrganizationNamespacesPage() {
  const queryClient = useQueryClient();
  const { selected, me } = useOrganization();

  const [urlState, changeUrlState] = useUrlState(NAMESPACES_URL_STATE);
  const [pendingRejection, setPendingRejection] = useState<ApiOrganizationNamespace | null>(null);

  const namespaces = useQuery(
    organizationNamespacesOptions(selected?.id, {
      limit: urlState.namespace_limit,
      offset: urlState.namespace_offset,
    })
  );

  /* Every page of namespaces is stale once one is decided, so they are all refetched. */
  const refreshNamespaces = () =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.all() });

  const reportFailure = unlessRateLimited((error: unknown) => {
    akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
  });

  const approve = useMutation({
    mutationFn: (namespace: ApiOrganizationNamespace) =>
      OrganizationService.approveOrganizationNamespace(Number(selected?.id), namespace.id),

    onSuccess: async () => {
      akNotify.success(akMT('namespaceApproved'));

      await refreshNamespaces();
    },

    onError: reportFailure,
  });

  const reject = useMutation({
    mutationFn: (namespace: ApiOrganizationNamespace) =>
      OrganizationService.rejectOrganizationNamespace(Number(selected?.id), namespace.id),

    onSuccess: async () => {
      akNotify.success(akMT('namespaceRejected'));
      setPendingRejection(null);

      await refreshNamespaces();
    },

    onError: reportFailure,
  });

  const columns = useMemo(
    () =>
      buildNamespaceColumns({
        isOwner: Boolean(me?.is_owner),
        approvingId: approve.isPending ? approve.variables.id : null,
        onApprove: approve.mutate,
        onReject: setPendingRejection,
      }),
    [me?.is_owner, approve.isPending, approve.variables, approve.mutate]
  );

  /*
    Drawn before the first answer and while another page is being read. A
    refresh of the page already shown keeps its rows, so approving or rejecting
    one namespace does not empty the table. Until there is an organization the
    query has not started, which is not the same as a list with nothing in it.
  */
  if (namespaces.isPending || namespaces.isPlaceholderData) {
    return (
      <div className="mt-3.5 flex w-full flex-col py-3.5" data-test-namespaces-loading>
        <TableSkeleton
          columns={columns}
          caption={akMT('namespaces')}
          wrapperClassName="bg-background"
        />
      </div>
    );
  }

  const rows = namespaces.data?.items ?? [];
  const totalItems = namespaces.data?.count ?? 0;

  if (totalItems === 0) {
    return <NamespacesEmpty isAdmin={Boolean(me?.is_admin)} />;
  }

  return (
    <div className="mt-3.5 flex w-full flex-col py-3.5" data-test-namespaces>
      <AkTable
        columns={columns}
        data={rows}
        caption={akMT('namespaces')}
        getRowId={(namespace) => String(namespace.id)}
        wrapperClassName="bg-background"
        data-test-namespaces-table
      />

      <AkPagination
        totalItems={totalItems}
        limit={urlState.namespace_limit}
        offset={urlState.namespace_offset}
        itemPerPageOptions={PAGE_SIZES}
        onPageChange={({ limit, offset }) =>
          changeUrlState({ namespace_limit: limit, namespace_offset: offset })
        }
        onItemPerPageChange={({ limit }) =>
          changeUrlState({ namespace_limit: limit, namespace_offset: 0 })
        }
        tableItemLabel={akMT('namespaces')}
        perPageLabel={akMT('recordPerPage')}
      />

      <AkConfirmBox
        isOpen={pendingRejection !== null}
        description={akMT('confirmBox.rejectNamespace')}
        isWorking={reject.isPending}
        onConfirm={() => pendingRejection && reject.mutate(pendingRejection)}
        onCancel={() => setPendingRejection(null)}
      />
    </div>
  );
}
