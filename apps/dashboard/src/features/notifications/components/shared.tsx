import type { ReactNode } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

export interface FileRiskCounts {
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  passed_count: number;
  untested_count: number;
}

/**
 * The severities a completed scan is counted by.
 *
 * The list flows down three rows and then into a second column, so the order
 * here reads top-to-bottom on the left, then top-to-bottom on the right.
 */
const SEVERITIES = [
  { id: 'critical', label: () => akMT('critical'), dot: cn('bg-severity-critical') },
  { id: 'high', label: () => akMT('high'), dot: cn('bg-severity-high') },
  { id: 'medium', label: () => akMT('medium'), dot: cn('bg-severity-medium') },
  { id: 'low', label: () => akMT('low'), dot: cn('bg-severity-low') },
  { id: 'passed', label: () => akMT('passed'), dot: cn('bg-severity-passed') },
  { id: 'untested', label: () => akMT('untested'), dot: cn('bg-severity-untested') },
] as const;

/**
 * The gaps a message stacks its lines by.
 *
 * Keyed by the stack spacing the design system counts in, where each step is
 * half of the 14px root: `1` is 7px, `2` is 14px.
 */
const SPACING = {
  none: cn(''),
  '0.5': cn('gap-1'),
  '1': cn('gap-1.75'),
  '1.5': cn('gap-2.5'),
  '2': cn('gap-3.5'),
} as const;

interface NotificationMessageLayoutProps {
  spacing?: keyof typeof SPACING;
  className?: string;
  children: ReactNode;
}

/**
 * Stacks a message's lines.
 *
 * @param props.spacing - The gap between lines, where `none` leaves each line to carry its own margin.
 * @param props.className - Padding the stack itself carries.
 * @param props.children - The lines.
 */
export function NotificationMessageLayout({
  spacing = 'none',
  className,
  children,
}: Readonly<NotificationMessageLayoutProps>) {
  return <div className={cn('flex flex-col', SPACING[spacing], className)}>{children}</div>;
}

/**
 * States the app version a notification is about.
 *
 * @param props.version - The version name.
 * @param props.versionCode - The build number.
 * @param props.className - Spacing, which differs between a padded line and one in a stack.
 */
export function NotificationVersionMeta({
  version,
  versionCode,
  className,
}: Readonly<{ version: string; versionCode: number | string; className?: string }>) {
  return (
    <AkTypography variant="body2" className={className} data-test-notification-version>
      <AkMessageTranslate id="versionLowercase" />
      {`: ${version} `}
      <span className="text-neutral-200">|</span> <AkMessageTranslate id="versionCode" />
      {`: ${versionCode}`}
    </AkTypography>
  );
}

/**
 * Breaks a completed scan's findings down by severity.
 *
 * @param props.title - What the breakdown is of, which differs between a file and a scan.
 * @param props.counts - The number of findings at each severity.
 */
export function NotificationRiskCountList({
  title,
  counts,
}: Readonly<{ title: string; counts: FileRiskCounts }>) {
  return (
    <div
      className="mt-2.75 mb-1.75 max-w-140 rounded-xs border border-divider-strong px-4.25 py-3.5"
      data-test-notification-risk-counts
    >
      <AkTypography variant="subtitle2" className="pb-3.5">
        {title}
      </AkTypography>

      <ul className="grid grid-flow-col grid-rows-3 gap-x-17.5 gap-y-1.25">
        {SEVERITIES.map((severity) => (
          <li key={severity.id} className="flex items-center justify-between">
            <span className="flex items-center">
              <span className={cn('mr-1.5 size-2.75 rounded-full', severity.dot)} />

              <AkTypography variant="body2">{severity.label()}</AkTypography>
            </span>

            <AkTypography variant="body2">{counts[`${severity.id}_count`]}</AkTypography>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A link out of a notification to the app's listing on a store.
 *
 * @param props.href - The store URL the notification carries.
 */
export function NotificationStoreLink({ href }: Readonly<{ href: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="self-start text-primary underline"
      data-test-notification-store-link
    >
      <AkMessageTranslate id="notificationModule.viewAppOnStore" />
    </a>
  );
}
