import type { ApiOrganizationNamespace } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';

import { ApprovalStatus } from './components/approval-status';
import { NamespaceValue } from './components/namespace-value';
import { RequestStatus } from './components/request-status';

/** What a row needs beyond the namespace itself to draw its controls. */
export interface NamespaceRowContext {
  isOwner: boolean;
  approvingId: number | null;
  onApprove: (namespace: ApiOrganizationNamespace) => void;
  onReject: (namespace: ApiOrganizationNamespace) => void;
}

const namespaceColumn = createAkTableColumns<ApiOrganizationNamespace>();

/**
 * Builds the three columns irene shows: the namespace, when it was asked for,
 * and whether it was approved.
 *
 * @param context - What the approval column needs to draw its controls.
 * @returns The columns, ready for `AkTable`.
 */
export const buildNamespaceColumns = (context: NamespaceRowContext) =>
  namespaceColumn.columns([
    namespaceColumn.accessor('value', {
      header: () => akMT('namespace'),
      meta: { width: '40%' },
      cell: ({ row }) => (
        <NamespaceValue value={row.original.value} platform={row.original.platform} />
      ),
    }),

    namespaceColumn.display({
      id: 'request-status',
      header: () => akMT('requestStatus'),
      meta: { width: '30%' },
      cell: ({ row }) => (
        <RequestStatus
          createdOn={row.original.created_on}
          requestedBy={row.original.requested_by}
        />
      ),
    }),

    namespaceColumn.display({
      id: 'approval-status',
      header: () => akMT('approvalStatus'),
      meta: { width: '30%' },
      cell: ({ row }) => (
        <ApprovalStatus
          isApproved={row.original.is_approved}
          approvedOn={row.original.approved_on}
          approvedBy={row.original.approved_by}
          isOwner={context.isOwner}
          isApproving={context.approvingId === row.original.id}
          onApprove={() => context.onApprove(row.original)}
          onReject={() => context.onReject(row.original)}
        />
      ),
    }),
  ]);
