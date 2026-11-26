import type { ReactNode } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface SettingsPanelProps {
  title: string;
  children: ReactNode;

  /** The line under the title, where the panel has one above its own contents. */
  subtitle?: string;
  description?: string;

  /** A control drawn at the end of the title's row, such as the section's own switch. */
  titleAction?: ReactNode;

  /** Classes for the section itself, for one irene caps the width of. */
  className?: string;
  testAttribute: string;
}

/**
 * One section of the organization's settings.
 *
 * Each section names itself and explains what it governs, which is the shape
 * every panel on this screen takes.
 *
 * The panel holds no spacing of its own. irene gives the title a gutter where
 * an introduction follows it and otherwise lets each section's own body set its
 * distance, so the same is done here rather than a gap that would stack on top
 * of those margins.
 *
 * @param props.title - What the section is.
 * @param props.children - The section's own contents.
 * @param props.subtitle - A heading under the title, where the section has one.
 * @param props.description - What the section governs.
 * @param props.titleAction - A control drawn at the end of the title's row.
 * @param props.className - Classes for the section itself.
 * @param props.testAttribute - Names the section's `data-test-*` attribute.
 */
export function SettingsPanel({
  title,
  children,
  subtitle,
  description,
  titleAction,
  className,
  testAttribute,
}: Readonly<SettingsPanelProps>) {
  const hasIntroduction = Boolean(subtitle) || Boolean(description);

  return (
    <section
      className={cn('flex w-full flex-col', className)}
      {...{ [`data-test-${testAttribute}`]: true }}
    >
      <div className="flex w-full items-center justify-between gap-3.5">
        <AkTypography
          tag="h2"
          variant="h5"
          gutterBottom={hasIntroduction}
          {...{ [`data-test-${testAttribute}-title`]: true }}
        >
          {title}
        </AkTypography>

        {titleAction}
      </div>

      {/* 3.5px in irene, which the spacing scale reaches at 4px. */}
      {hasIntroduction && (
        <div className="flex flex-col gap-1">
          {subtitle && (
            <AkTypography
              tag="h3"
              variant="h6"
              {...{ [`data-test-${testAttribute}-subtitle`]: true }}
            >
              {subtitle}
            </AkTypography>
          )}

          {description && (
            <AkTypography
              variant="body2"
              color="textSecondary"
              {...{ [`data-test-${testAttribute}-description`]: true }}
            >
              {description}
            </AkTypography>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
