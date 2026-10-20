import type { ReactNode } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface AnalyticsCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The panel every figure on this page sits in: a heading, and the figure below it.
 *
 * One component rather than one per panel, so the page reads as a set rather
 * than four boxes that happen to be near each other.
 *
 * @param props.title - What the panel shows.
 * @param props.actions - Controls for the panel, opposite the heading.
 * @param props.children - The figure itself.
 * @param props.className - Laid out by the page.
 */
export function AnalyticsCard({
  title,
  actions,
  children,
  className,
}: Readonly<AnalyticsCardProps>) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-sm border border-border bg-background shadow-3',
        className
      )}
      data-test-analytics-card
    >
      <header
        className="
          flex min-h-11 items-center justify-between gap-4 border-b border-divider-strong px-3.5
          py-2
        "
      >
        <AkTypography variant="subtitle1" fontWeight="medium">
          {title}
        </AkTypography>

        {actions}
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-3">{children}</div>
    </section>
  );
}
