import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';

import {
  StoreknoxService,
  type ApiSkInventoryApp,
  type ApiSkSubscription,
} from '@irene/api/services/storeknox';

import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import {
  skInventoryAppOptions,
  skSubscriptionOptions,
  storeknoxKeys,
} from '@/features/storeknox/queries/inventory';

import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { hasLicense } from '@/features/storeknox/utils/sk-app';
import { useOrganization } from '@/hooks/use-organization';
import { storeknoxOrganizationOptions } from '@/queries/organization';

/**
 * Whether the subscription's end date has passed, as irene's `orgSubIsExpired` reads it.
 *
 * A subscription with no end date does not expire. `dayjs(undefined)` is the current
 * instant, so comparing against it would answer on whether a millisecond passed between
 * the two readings, and that answer decides whether a licence is spent without asking.
 */
export const subscriptionIsExpired = (subscription: ApiSkSubscription | undefined) =>
  Boolean(subscription?.end_date) && dayjs().isAfter(subscription?.end_date);

/**
 * The details header's monitoring switch. Turning an unlicensed app on asks first,
 * since it spends a licence; the switch flips optimistically and reverts on failure.
 */
export function useMonitoringToggle(app: ApiSkInventoryApp) {
  const queryClient = useQueryClient();
  const { isOwner, isAdmin } = useOrganization();
  const [checked, setChecked] = useState(app.monitoring_enabled);
  const [drawerMounted, setDrawerMounted] = useState(false);

  const { data: storeknoxOrganization } = useQuery(storeknoxOrganizationOptions());
  const organizationId = storeknoxOrganization?.id ?? '';

  const { data: subscription } = useQuery({
    ...skSubscriptionOptions(organizationId),
    enabled: Boolean(storeknoxOrganization),
  });

  const toggle = useMutation({
    mutationFn: (next: boolean) => StoreknoxService.updateMonitoring(app.id, next),
    onSuccess: async (_, next) => {
      const reloaded = await queryClient.query({
        ...skInventoryAppOptions(app.id),
        staleTime: 0,
      });

      /* The inventory lists show the monitoring state. */
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });

      akNotify.success(
        `${akMT('storeknox.monitoring')} ${next ? akMT('enabled') : akMT('disabled')}`
      );

      /* An unlicensed app spent or freed a licence, so the count left has moved. */
      if (!hasLicense(reloaded)) {
        await queryClient.invalidateQueries({
          queryKey: storeknoxKeys.subscription(organizationId),
        });
      }
    },
    onError: unlessRateLimited((error, next) => {
      setChecked(!next);
      akNotify.error(skErrorMessage(error));
    }),
  });

  const confirm = () => toggle.mutate(checked);

  const onToggle = (next: boolean) => {
    if (!isOwner() && !isAdmin()) {
      return;
    }

    setChecked(next);

    const flipsStraightAway =
      hasLicense(app) ||
      Boolean(subscription?.is_trial) ||
      subscriptionIsExpired(subscription) ||
      (app.monitoring_enabled && !hasLicense(app));

    if (flipsStraightAway) {
      toggle.mutate(next);
    } else {
      setDrawerMounted(true);
    }
  };

  /* The drawer closes itself and reports once it has left the DOM. */
  const cancel = () => setChecked((current) => !current);

  return {
    checked,
    isToggling: toggle.isPending,
    drawerMounted,
    unmountDrawer: () => setDrawerMounted(false),
    organizationId,
    onToggle,
    confirm,
    cancel,
  };
}
