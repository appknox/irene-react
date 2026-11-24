import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';

interface TeamActionFooterProps {
  actionLabel: string;
  isWorking: boolean;
  isDisabled?: boolean;
  onAction: () => void;
  onBack: () => void;
}

/**
 * The bar under a pane of the team drawer that performs one action.
 *
 * It sits at the foot of the drawer, as irene's does, with the way back beside
 * the action so leaving is always available while the action is unavailable.
 *
 * @param props.actionLabel - The action's own word.
 * @param props.isWorking - Whether the action is under way.
 * @param props.isDisabled - Whether there is nothing to act on yet.
 * @param props.onAction - Called to perform the action.
 * @param props.onBack - Called to return to the team's details.
 */
export function TeamActionFooter({
  actionLabel,
  isWorking,
  isDisabled = false,
  onAction,
  onBack,
}: Readonly<TeamActionFooterProps>) {
  return (
    <div className="flex items-center justify-end gap-2.5 border-t border-border p-3.5">
      <AkButton
        variant="outlined"
        color="neutral"
        onClick={onBack}
        data-test-team-action-back
      >
        {akMT('back')}
      </AkButton>

      <AkButton
        loading={isWorking}
        disabled={isDisabled}
        onClick={onAction}
        data-test-team-action-confirm
      >
        {actionLabel}
      </AkButton>
    </div>
  );
}
