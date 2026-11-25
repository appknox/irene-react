import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { JiraSecurityStatus } from '@irene/api/services/integration';

/** What the panel's first line says, by how far the connection has got. */
const HEADLINES: Record<JiraSecurityStatus, () => string> = {
  connected: () => akMT('jiraSecurity.headlineConnected'),
  awaiting_jira: () => akMT('jiraSecurity.headlineWaiting'),
  not_connected: () => akMT('jiraSecurity.headlineWaiting'),
};

/** What the chip beside it reads. */
const LABELS: Record<JiraSecurityStatus, () => string> = {
  connected: () => akMT('jiraSecurity.connected'),
  awaiting_jira: () => akMT('jiraSecurity.awaitingJira'),
  not_connected: () => akMT('jiraSecurity.notConnected'),
};

/** What the line under it explains to do next. */
const HELP: Record<JiraSecurityStatus, () => string> = {
  connected: () => akMT('jiraSecurity.connectedHelp'),
  awaiting_jira: () => akMT('jiraSecurity.awaitingHelp'),
  not_connected: () => akMT('jiraSecurity.notConnectedHelp'),
};

/** Which colour the chip takes, which is how irene tints each state. */
const COLORS: Record<JiraSecurityStatus, 'success' | 'warn' | 'default'> = {
  connected: 'success',
  awaiting_jira: 'warn',
  not_connected: 'default',
};

/**
 * The band at the top of the panel: where the connection stands, and what to do next.
 *
 * @param props.status - How far the connection has got.
 */
export function JiraSecurityStatusBand({ status }: Readonly<{ status: JiraSecurityStatus }>) {
  return (
    <div className="flex flex-col gap-1.75 border-b border-border p-4.5">
      <div className="flex w-full items-center justify-between">
        <AkTypography variant="subtitle1" fontWeight="bold">
          {HEADLINES[status]()}
        </AkTypography>

        <AkChip
          size="small"
          variant="semi-filled"
          color={COLORS[status]}
          label={LABELS[status]()}
          data-test-jira-security-status
        />
      </div>

      <AkTypography variant="body2" color="textSecondary" data-test-jira-security-help>
        {HELP[status]()}
      </AkTypography>
    </div>
  );
}

interface JiraSecurityStepProps {
  number: number;
  title: string;
  help: string;
  children: ReactNode;
}

/**
 * One numbered step of the connection, with what it is for under its heading.
 *
 * @param props.number - Which step this is, counted from whichever steps this deployment shows.
 * @param props.title - The step's heading.
 * @param props.help - What the step is for.
 * @param props.children - The step's own controls.
 */
export function JiraSecurityStep({
  number,
  title,
  help,
  children,
}: Readonly<JiraSecurityStepProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.75">
        <AkTypography
          variant="body3"
          className="
            flex size-5.25 shrink-0 items-center justify-center rounded-full bg-secondary text-white
          "
        >
          {number}
        </AkTypography>

        <AkTypography variant="subtitle2" fontWeight="bold">
          {title}
        </AkTypography>
      </div>

      <AkTypography variant="body2" color="textSecondary">
        {help}
      </AkTypography>

      {children}
    </div>
  );
}
