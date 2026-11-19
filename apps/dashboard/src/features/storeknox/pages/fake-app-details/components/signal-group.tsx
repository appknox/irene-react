import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkChip } from '@irene/ui/ak-chip';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import type {
  Signal,
  SignalGroup as SignalGroupData,
} from '@/features/storeknox/utils/fake-app-signals';

import { SignalResult } from './signal-result';

const BADGE_COLOR = { high: 'error', medium: 'warn', low: 'success' } as const;

interface SignalGroupProps {
  group: SignalGroupData;
  onSignalClick: (signal: Signal, groupTitle: string) => void;
}

/**
 * One group of the AI's findings: its title, description and badge, then a row per signal that
 * opens the signal's reasoning.
 *
 * @param props.group - The group built from the copy's scores.
 * @param props.onSignalClick - Called with the signal and the group's title when a row is pressed.
 */
export function SignalGroup({ group, onSignalClick }: Readonly<SignalGroupProps>) {
  return (
    <section
      className="flex w-full flex-col border border-border bg-background"
      aria-label={group.title}
      data-test-sk-signal-group={group.id}
    >
      <div className="flex w-full items-center justify-between gap-2 p-6">
        <div className="flex flex-col gap-1">
          <AkTypography fontWeight="bold">{group.title}</AkTypography>

          <AkTypography color="textSecondary">{group.description}</AkTypography>
        </div>

        <AkChip
          variant="semi-filled"
          fontWeight="bold"
          color={BADGE_COLOR[group.badge.level]}
          label={group.badge.label}
          data-test-sk-signal-group-badge
        />
      </div>

      <AkDivider color="dark" />

      <div className="flex w-full justify-between px-6 py-3">
        <AkTypography variant="body2" fontWeight="bold" color="textSecondary">
          <AkMessageTranslate id="storeknox.fakeApps.signal" />
        </AkTypography>

        <AkTypography variant="body2" fontWeight="bold" color="textSecondary" className="pr-6">
          <AkMessageTranslate id="storeknox.fakeApps.result" />
        </AkTypography>
      </div>

      {group.signals.map((signal) => (
        <div key={signal.rule}>
          <AkDivider color="dark" />

          <button
            type="button"
            className="
              flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left
              hover:bg-hover-light
            "
            onClick={() => onSignalClick(signal, group.title)}
            data-test-sk-signal-row={signal.rule}
          >
            <AkTypography tag="span">{signal.title}</AkTypography>

            <span className="flex items-center gap-2">
              <SignalResult signal={signal} />

              <AkIcon name="material-symbols:chevron-right" className="size-4" />
            </span>
          </button>
        </div>
      ))}
    </section>
  );
}
