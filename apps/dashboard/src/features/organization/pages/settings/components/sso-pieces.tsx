import type { ComponentProps, ReactNode } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

/**
 * A bordered box, which is how every part of the SSO settings is set off.
 *
 * @param props.children - What the box holds.
 * @param props.testAttribute - Names the box's `data-test-*` attribute.
 */
export function SsoBox({
  children,
  testAttribute,
}: Readonly<{ children: ReactNode; testAttribute: string }>) {
  return (
    <div
      className="flex w-full flex-col rounded-xs border border-border"
      {...{ [`data-test-${testAttribute}`]: true }}
    >
      {children}
    </div>
  );
}

/**
 * One titled section of such a box, ruled off from the next.
 *
 * @param props.children - The section's contents.
 * @param props.isLast - Leaves the rule off, for the section at the bottom.
 */
export function SsoBoxSection({
  children,
  isLast = false,
}: Readonly<{ children: ReactNode; isLast?: boolean }>) {
  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full flex-col gap-1 p-3.5">{children}</div>

      {!isLast && <AkDivider color="dark" />}
    </div>
  );
}

/**
 * A label above a value, as the metadata is read out.
 *
 * @param props.label - What the value is.
 * @param props.value - The value itself.
 */
export function SsoField({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="flex flex-col">
      <AkTypography variant="subtitle2" data-test-sso-field-label>
        {label}
      </AkTypography>

      <AkTypography variant="body2" color="textSecondary" data-test-sso-field-value>
        {value}
      </AkTypography>
    </div>
  );
}

/**
 * The notice above the other tab's steps, where one kind is already set up.
 *
 * @param props.text - What the notice says.
 */
export function SsoWarningBanner({ text }: Readonly<{ text: string }>) {
  return (
    <div className="flex w-full flex-col gap-3.5" data-test-sso-warning-banner>
      <div className="flex items-center gap-1.75">
        <AkIcon
          name="material-symbols:warning"
          className="size-4.75 text-warning-strong"
          aria-hidden
        />

        <AkTypography variant="body2" data-test-sso-warning-banner-text>
          {text}
        </AkTypography>
      </div>

      <AkDivider color="dark" />
    </div>
  );
}

/**
 * What to do to move from one kind of sign-on to the other, numbered.
 *
 * @param props.title - What the steps are for.
 * @param props.steps - The steps, in order.
 */
export function SsoStepsDisplay({ title, steps }: Readonly<{ title: string; steps: string[] }>) {
  return (
    <div className="flex flex-col gap-3.5" data-test-sso-steps>
      <AkTypography variant="subtitle1" data-test-sso-steps-title>
        {title}
      </AkTypography>

      {steps.map((step, index) => (
        <div key={step} className="flex items-start gap-2.75" data-test-sso-step>
          <span
            className="
              flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm
              text-primary-foreground
            "
            aria-hidden
          >
            {index + 1}
          </span>

          <AkTypography>{step}</AkTypography>
        </div>
      ))}
    </div>
  );
}

/** The heading above a section, with the icon irene draws beside it. */
export function SsoSectionHeading({
  icon,
  children,
}: Readonly<{ icon?: ComponentProps<typeof AkIcon>['name']; children: ReactNode }>) {
  return (
    <div className="flex items-center gap-1.75">
      {icon !== undefined && (
        <AkIcon name={icon} className="size-4.75 text-foreground" aria-hidden />
      )}

      <AkTypography variant="subtitle1">{children}</AkTypography>
    </div>
  );
}
