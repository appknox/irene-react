import { type ReactNode } from 'react';
import { AkTypography } from '@irene/ui/ak-typography';

interface BillingSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * One block of the billing and subscription pages: a bordered card with its
 * title, an optional line under it, and a control beside it.
 *
 * @param props.title - What the block holds.
 * @param props.description - The line under the title.
 * @param props.action - A control opposite the title.
 * @param props.children - The block's content.
 */
export function BillingSection({
  title,
  description,
  action,
  children,
}: Readonly<BillingSectionProps>) {
  return (
    <section className="flex flex-col gap-5.25 rounded-sm border border-border bg-background p-5.25">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1.75">
          <AkTypography tag="h2" variant="h5">
            {title}
          </AkTypography>

          {description && <AkTypography color="textSecondary">{description}</AkTypography>}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}
