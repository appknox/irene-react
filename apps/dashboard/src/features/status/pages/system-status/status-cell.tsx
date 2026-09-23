import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';

/**
 * What one system's check last answered.
 *
 * @param props.isChecking - Whether the check is still in flight.
 * @param props.isWorking - Whether the system answered.
 * @param props.hint - Wording shown under a system that did not answer, where one helps.
 */
export function SystemStatusCell({
  isChecking,
  isWorking,
  hint,
}: Readonly<{ isChecking: boolean; isWorking: boolean; hint?: string }>) {
  if (isChecking) {
    return (
      <span className="flex items-center gap-1" data-test-system-status-checking>
        <AkSpinner className="size-3.5 text-primary" aria-hidden />

        <AkTypography tag="span">
          <AkMessageTranslate id="checking" />
        </AkTypography>
      </span>
    );
  }

  if (isWorking) {
    return (
      <span className="flex items-center gap-1" data-test-system-status-operational>
        <AkIcon name="material-symbols:check-circle" className="size-3.5 text-success" />

        <AkTypography tag="span" color="success">
          <AkMessageTranslate id="operational" />
        </AkTypography>
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-0.5" data-test-system-status-unreachable>
      <span className="flex items-center gap-1">
        <AkIcon name="material-symbols:warning" className="size-3.5 text-danger" />

        <AkTypography tag="span" color="error">
          <AkMessageTranslate id="unreachable" />
        </AkTypography>
      </span>

      {hint && (
        <AkTypography variant="body3" color="textSecondary">
          {hint}
        </AkTypography>
      )}
    </span>
  );
}
