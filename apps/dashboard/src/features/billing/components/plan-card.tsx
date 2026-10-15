import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiPlan } from '@irene/api/services/billing';

import {
  getCheckoutUrl,
  getPlanPricing,
  isWebUrl,
  type PaymentDuration,
} from '@/features/billing/utils';

/** The plan irene counts in scans; every other plan counts apps. */
const PER_SCAN_PLAN_ID = 'default_per_scan';

interface PlanCardProps {
  plan: ApiPlan;
  duration: PaymentDuration;
}

/**
 * One plan: what it includes, how many apps or scans to buy, and the button
 * that takes the owner to pay for them.
 *
 * Checkout happens on the payment provider's page. As in irene, only a
 * production build goes there, so a development or test build never starts a
 * real payment.
 *
 * @param props.plan - The plan.
 * @param props.duration - The billing period its price is shown for.
 */
export function PlanCard({ plan, duration }: Readonly<PlanCardProps>) {
  const [quantity, setQuantity] = useState(1);
  const { price, url } = getPlanPricing(plan, duration);

  const features = plan.description
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const unit = plan.plan_id === PER_SCAN_PLAN_ID ? akMT('scan') : akMT('appOrS');

  const checkout = () => {
    const checkoutUrl = getCheckoutUrl(url, quantity);

    if (url && import.meta.env.PROD && isWebUrl(checkoutUrl)) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <article
      className="
        flex flex-col gap-5.25 rounded-sm border border-border bg-background p-5.25 shadow-6
      "
      data-test-plan={plan.id}
    >
      <AkTypography tag="h3" variant="h5">
        {plan.name}
      </AkTypography>

      <ul className="flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-1.75">
            <AkIcon name="material-symbols:check" className="mt-0.5 size-4 shrink-0 text-success" />

            <AkTypography color="textSecondary">{feature}</AkTypography>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3.5 rounded-sm bg-background-subtle p-2.5">
        <AkIconButton
          variant="outlined"
          size="small"
          aria-label={akMT('decreaseQuantity')}
          disabled={quantity <= 1}
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          data-test-plan-decrease
        >
          <AkIcon name="material-symbols:remove" />
        </AkIconButton>

        <div className="flex flex-col items-center">
          <AkTypography variant="h5" aria-live="polite" data-test-plan-quantity>
            {quantity}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary" className="text-sm uppercase">
            {unit}
          </AkTypography>
        </div>

        <AkIconButton
          variant="outlined"
          size="small"
          aria-label={akMT('increaseQuantity')}
          onClick={() => setQuantity((current) => current + 1)}
          data-test-plan-increase
        >
          <AkIcon name="material-symbols:add" />
        </AkIconButton>
      </div>

      <AkButton type="button" className="w-full" onClick={checkout} data-test-plan-pay>
        {akMT('payAmount', { amount: price * quantity })}
      </AkButton>
    </article>
  );
}
