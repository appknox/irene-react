import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useStore } from 'zustand';
import type { ReactNode } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { organizationStore } from '@irene/api/stores/organization';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

import { organizationKeys, organizationNamespaceOptions } from '@/queries/organization';

import { NotificationStoreLink } from './shared';

interface NamespaceMessageProps {
  namespaceId: number;
  storeUrl?: string;
  children: ReactNode;
}

/**
 * States the namespace request and, for one still open, offers to settle it.
 *
 * The request's standing is not in the notification: it is read from the
 * namespace itself, so a request another moderator has already settled reads
 * as settled here too. A namespace that is gone was rejected — rejecting
 * removes it — so a failed read is the rejected state rather than an error.
 *
 * @param props.namespaceId - The namespace the request is for.
 * @param props.storeUrl - The app's store listing, where the request came from one.
 * @param props.children - The message stating who asked for what.
 */
export function NotificationNamespaceMessage({
  namespaceId,
  storeUrl,
  children,
}: Readonly<NamespaceMessageProps>) {
  const queryClient = useQueryClient();
  const organizationId = useStore(organizationStore, (org) => org.selected?.id);

  const {
    data: namespace,
    isPending,
    isError,
  } = useQuery(organizationNamespaceOptions(organizationId, namespaceId));

  const settleRequest = useMutation({
    mutationFn: async (approve: boolean) => {
      /* The buttons are only reachable once the namespace has been read, which needs the organization. */
      if (organizationId === undefined) {
        return;
      }

      const action = approve
        ? OrganizationService.approveOrganizationNamespace
        : OrganizationService.rejectOrganizationNamespace;

      await action(organizationId, namespaceId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.namespace(organizationId, namespaceId),
      }),
  });

  const isRejected = isError;
  const isApproved = Boolean(namespace?.is_approved);
  const isUnmoderated = !isPending && !isRejected && !isApproved;

  return (
    <div>
      <div className="flex items-center gap-1" data-test-namespace-title>
        <AkIcon name="material-symbols:description" className="size-4.5" />

        <AkTypography variant="subtitle2">
          <AkMessageTranslate id="approvalRequest" />
        </AkTypography>
      </div>

      {/* The request and how it stands share one bordered block. */}
      <div className="mt-2.5 mb-1.75 rounded-xs border border-divider-strong px-4.25 py-3.5">
        {children}

        {isPending && <AkSkeleton className="mt-1.75 h-4 w-40" />}

        {isApproved && (
          <div className="mt-1.75 flex items-center gap-1.75" data-test-namespace-approved>
            <AkIcon name="material-symbols:check-circle" className="size-4.5 text-success" />

            <AkTypography>
              <AkMessageTranslate
                id="notificationModule.namespaceMessage.approved"
                values={{
                  moderaterName: namespace?.approved_by ?? '',
                }}
              />
            </AkTypography>
          </div>
        )}

        {isRejected && (
          <div className="mt-1.75 flex items-center gap-1.75" data-test-namespace-rejected>
            <AkIcon name="material-symbols:cancel" className="size-4.5 text-danger" />

            <AkTypography>
              <AkMessageTranslate id="notificationModule.namespaceMessage.rejected" />
            </AkTypography>
          </div>
        )}

        {isUnmoderated && (
          <div className="mt-1.75 flex items-center gap-1.75">
            <AkButton
              color="primary"
              disabled={settleRequest.isPending}
              onClick={() => settleRequest.mutate(true)}
              data-test-namespace-approve
            >
              <AkMessageTranslate id="approve" />
            </AkButton>

            <AkButton
              variant="outlined"
              color="neutral"
              disabled={settleRequest.isPending}
              onClick={() => settleRequest.mutate(false)}
              data-test-namespace-reject
            >
              <AkMessageTranslate id="reject" />
            </AkButton>
          </div>
        )}
      </div>

      {(isUnmoderated || storeUrl) && (
        <div className="flex items-center gap-2.5">
          {isUnmoderated && (
            <Link
              to="/dashboard/organization/namespaces"
              className="self-start text-primary underline"
            >
              <AkMessageTranslate id="notificationModule.viewNamespaces" />
            </Link>
          )}

          {isUnmoderated && storeUrl && <span className="text-neutral-200">|</span>}

          {storeUrl && <NotificationStoreLink href={storeUrl} />}
        </div>
      )}
    </div>
  );
}
