import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { cn } from '@irene/ui/cn';

import {
  getDurationLabel,
  PAYMENT_DURATIONS,
  type PaymentDuration,
} from '@/features/billing/utils';

import { plansOptions } from '@/features/billing/queries/billing';

import { BillingSection } from './billing-section';
import { PlanCard } from './plan-card';

/**
 * The plans an organization without a subscription can buy, priced for the
 * billing period chosen above them. Plans are listed in the order the server
 * numbers them, as irene sorts them.
 *
 * @param props.organizationId - The organization.
 */
export function PlansSection({ organizationId }: Readonly<{ organizationId: string }>) {
  const [duration, setDuration] = useState<PaymentDuration>(PAYMENT_DURATIONS[0]);
  const plans = useQuery(plansOptions(organizationId));
  const sortedPlans = [...(plans.data ?? [])].sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <BillingSection
      title={akMT('plans')}
      action={
        <div
          role="group"
          aria-label={akMT('billingPeriod')}
          className="inline-flex gap-0.5 rounded-md bg-divider-strong p-0.75"
          data-test-plan-durations
        >
          {PAYMENT_DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === duration}
              onClick={() => setDuration(option)}
              className={cn(
                'h-8 cursor-pointer rounded-sm px-3 text-base font-medium transition-colors',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                option === duration
                  ? 'bg-background text-foreground shadow-15'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {getDurationLabel(option)}
            </button>
          ))}
        </div>
      }
    >
      {plans.isPending ? (
        <div className="grid gap-5.25 md:grid-cols-3" data-test-plans-loading>
          {[0, 1, 2].map((index) => (
            <AkSkeleton key={index} height="320px" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5.25 md:grid-cols-3">
          {sortedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} duration={duration} />
          ))}
        </div>
      )}
    </BillingSection>
  );
}
