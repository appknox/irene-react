import { useQuery } from '@tanstack/react-query';

import { AkSkeleton } from '@irene/ui/ak-skeleton';

import { subscriptionsOptions } from '@/features/billing/queries/billing';

import { InvoiceList } from './invoice-list';
import { PlansSection } from './plans-section';
import { SubscriptionCard } from './subscription-card';

/**
 * Billing for an organization that pays through the dashboard: its
 * subscription when it has one, the plans it can buy when it has none, and its
 * invoices either way.
 *
 * Only the first subscription is shown, as irene shows it. The plans are not
 * asked for until the subscriptions have answered, since an organization with
 * one is never offered them.
 *
 * @param props.organizationId - The organization.
 */
export function OrganizationBilling({ organizationId }: Readonly<{ organizationId: string }>) {
  const subscriptions = useQuery(subscriptionsOptions(organizationId));
  const [subscription] = subscriptions.data ?? [];

  return (
    <div className="flex flex-col gap-5.25" data-test-organization-billing>
      {subscriptions.isPending && <AkSkeleton height="160px" data-test-subscription-loading />}

      {subscriptions.isSuccess &&
        (subscription ? (
          <SubscriptionCard organizationId={organizationId} subscription={subscription} />
        ) : (
          <PlansSection organizationId={organizationId} />
        ))}

      <InvoiceList organizationId={organizationId} />
    </div>
  );
}
