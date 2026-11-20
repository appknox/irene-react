import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
} from '@irene/ui/ak-modal';

import { BillingService, type ApiSubscription } from '@irene/api/services/billing';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  formatBillingDate,
  getBillingPeriodLabel,
  getSubscriptionDateLabel,
  isEndingSoon,
} from '@/features/billing/utils';

import { billingKeys } from '@/features/billing/queries/billing';

import { BillingSection } from './billing-section';

interface SubscriptionCardProps {
  organizationId: string;
  subscription: ApiSubscription;
}

/**
 * Where the subscription stands: cancelled, in trial, or active.
 *
 * @param props.subscription - The subscription.
 */
function SubscriptionStatus({ subscription }: Readonly<{ subscription: ApiSubscription }>) {
  if (subscription.is_cancelled) {
    return <AkChip variant="semi-filled" size="small" color="error" label={akMT('cancelled')} />;
  }

  return subscription.is_trial ? (
    <AkChip
      variant="semi-filled"
      size="small"
      color="info"
      label={akMT('subscriptionStatusTrial')}
    />
  ) : (
    <AkChip
      variant="semi-filled"
      size="small"
      color="success"
      label={akMT('subscriptionStatusActive')}
    />
  );
}

/**
 * The control that cancels the subscription, behind a confirmation.
 *
 * Cancelling takes effect at the end of the term, so the subscription stays
 * listed: it is marked cancelled in the cache rather than fetched again.
 *
 * @param props.organizationId - The organization the subscription belongs to.
 * @param props.subscriptionId - The subscription.
 */
function CancelSubscription({
  organizationId,
  subscriptionId,
}: Readonly<{ organizationId: string; subscriptionId: string }>) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  const cancel = useMutation({
    mutationFn: () => BillingService.cancelSubscription(organizationId, subscriptionId),

    onSuccess: () => {
      queryClient.setQueryData<ApiSubscription[]>(
        billingKeys.subscriptions(organizationId),
        (subscriptions) =>
          subscriptions?.map((item) =>
            item.id === subscriptionId ? { ...item, is_cancelled: true } : item
          )
      );

      setIsConfirming(false);
      akNotify.success(akMT('subscriptionCancelled'));
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('somethingWentWrong'));
    }),
  });

  return (
    <AkModal
      open={isConfirming}
      onOpenChange={(isOpen) => !cancel.isPending && setIsConfirming(isOpen)}
    >
      <AkButton
        type="button"
        variant="outlined"
        color="neutral"
        className="self-start"
        onClick={() => setIsConfirming(true)}
      >
        {akMT('cancelSubsciption')}
      </AkButton>

      <AkModalContent aria-describedby={undefined}>
        <AkModalHeader title={akMT('cancelSubsciption')} closeLabel={akMT('close')} />

        <AkModalBody>
          <AkTypography>{akMT('confirmBox.cancelSubsciption')}</AkTypography>
        </AkModalBody>

        <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
          <AkButton
            type="button"
            variant="outlined"
            color="neutral"
            disabled={cancel.isPending}
            onClick={() => setIsConfirming(false)}
          >
            {akMT('keepSubscription')}
          </AkButton>

          <AkButton
            type="button"
            color="error"
            loading={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            {akMT('cancelSubsciption')}
          </AkButton>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  );
}

/**
 * The organization's subscription: the plan, how many apps it covers, how
 * often it bills, when it next renews or lapses, and a way to cancel it.
 *
 * A cancelled subscription ending within `EXPIRY_WARNING_DAYS` says so above
 * its details, since paid features stop with it. A renewing one does not: its
 * date is a charge, not a loss.
 *
 * A per-scan subscription shows its heading alone, as irene's does: its
 * details are not the plan-and-period kind this card lays out.
 *
 * @param props.organizationId - The organization the subscription belongs to.
 * @param props.subscription - The subscription.
 */
export function SubscriptionCard({
  organizationId,
  subscription,
}: Readonly<SubscriptionCardProps>) {
  const endsSoon = subscription.is_cancelled && isEndingSoon(subscription.expiry_date);
  const endDate = formatBillingDate(subscription.expiry_date);

  const figures = [
    { id: 'plan', label: akMT('currentPlan'), value: subscription.plan_name },
    { id: 'quantity', label: akMT('noOfApps'), value: subscription.plan_quantity },
    { id: 'period', label: akMT('billingPeriod'), value: getBillingPeriodLabel(subscription) },
    { id: 'date', label: getSubscriptionDateLabel(subscription), value: endDate },
  ];

  return (
    <BillingSection
      title={akMT('activeSubscription')}
      action={!subscription.is_per_scan && <SubscriptionStatus subscription={subscription} />}
    >
      {!subscription.is_per_scan && (
        <div className="flex flex-col gap-5.25" data-test-subscription>
          {endsSoon && (
            <AkAlert variant="warning" data-test-subscription-ending>
              <AkIcon name="material-symbols:warning" />

              <AkAlertDescription>
                {subscription.is_trial
                  ? akMT('trialEndingWarning', { date: endDate })
                  : akMT('subscriptionEndingWarning', { date: endDate })}
              </AkAlertDescription>
            </AkAlert>
          )}

          <dl className="grid gap-5.25 sm:grid-cols-2 lg:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.id} className="flex flex-col gap-0.5">
                <AkTypography tag="dt" variant="body2" color="textSecondary">
                  {figure.label}
                </AkTypography>

                <AkTypography
                  tag="dd"
                  fontWeight="medium"
                  data-test-subscription-figure={figure.id}
                >
                  {figure.value}
                </AkTypography>
              </div>
            ))}
          </dl>

          {!subscription.is_cancelled && (
            <CancelSubscription organizationId={organizationId} subscriptionId={subscription.id} />
          )}
        </div>
      )}
    </BillingSection>
  );
}
