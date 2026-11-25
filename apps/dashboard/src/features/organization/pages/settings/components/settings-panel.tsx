import type { ReactNode } from 'react';
import { AkTypography } from '@irene/ui/ak-typography';

interface SettingsPanelProps {
  title: string;
  children: ReactNode;

  /** The line under the title, where the panel has one above its own contents. */
  subtitle?: string;
  description?: string;
  testAttribute: string;
}

/**
 * One section of the organization's settings.
 *
 * Each section names itself and explains what it governs, which is the shape
 * every panel on this screen takes.
 *
 * @param props.title - What the section is.
 * @param props.children - The section's own contents.
 * @param props.subtitle - A heading under the title, where the section has one.
 * @param props.description - What the section governs.
 * @param props.testAttribute - Names the section's `data-test-*` attribute.
 */
export function SettingsPanel({
  title,
  children,
  subtitle,
  description,
  testAttribute,
}: Readonly<SettingsPanelProps>) {
  return (
    <section className="flex w-full flex-col gap-1" {...{ [`data-test-${testAttribute}`]: true }}>
      <AkTypography tag="h2" variant="h5" {...{ [`data-test-${testAttribute}-title`]: true }}>
        {title}
      </AkTypography>

      {(subtitle || description) && (
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
