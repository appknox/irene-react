import type { ReactNode } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface SectionCardProps {
  title: string;
  children: ReactNode;

  /** Tinted while the section is being changed, as irene marks the one in hand. */
  headerColor?: 'default' | 'primary';

  /** A control in the header, such as the one that opens the section for editing. */
  headerAction?: ReactNode;

  /** The controls under the section, which only an open section carries. */
  footerAction?: ReactNode;
  testAttribute: string;
}

/**
 * One section of a service account: a titled, bordered card.
 *
 * The same card serves the create screen and the details screen; which controls
 * it carries is the section's own business.
 *
 * @param props.title - What the section is.
 * @param props.children - The section's contents.
 * @param props.headerColor - Tints the header while the section is open for editing.
 * @param props.headerAction - A control drawn at the end of the header.
 * @param props.footerAction - Controls drawn under the body, above the card's edge.
 * @param props.testAttribute - Names the section's `data-test-*` attribute.
 */
export function SectionCard({
  title,
  children,
  headerColor = 'default',
  headerAction,
  footerAction,
  testAttribute,
}: Readonly<SectionCardProps>) {
  return (
    <div
      className="w-full rounded-xs border border-border"
      {...{ [`data-test-${testAttribute}`]: true }}
    >
      <div
        className={cn(
          'flex items-center justify-between px-5.25 py-3.5',
          headerColor === 'primary' ? 'bg-primary/20 text-primary' : 'bg-neutral-100'
        )}
      >
        <AkTypography
          tag="h3"
          variant="subtitle1"
          color="inherit"
          {...{ [`data-test-${testAttribute}-title`]: true }}
        >
          {title}
        </AkTypography>

        {headerAction}
      </div>

      <AkDivider color="dark" />

      <div className="bg-background p-5.25">{children}</div>

      {footerAction && (
        <div
          className="flex items-center gap-2.75 bg-background px-5.25 py-3.5 shadow-4"
          {...{ [`data-test-${testAttribute}-footer`]: true }}
        >
          {footerAction}
        </div>
      )}
    </div>
  );
}
