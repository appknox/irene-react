import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

interface RevokeQuestionProps {
  question: string;
  isRevoking: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The question asked inside the panel before a connection is revoked.
 *
 * It replaces the panel's own controls rather than opening over them, as irene
 * asks it, so the answer is given where the connection is.
 *
 * @param props.question - What is being asked.
 * @param props.isRevoking - Marks the confirming control busy.
 * @param props.onConfirm - Called to go ahead.
 * @param props.onCancel - Called to leave the connection as it is.
 */
export function RevokeQuestion({
  question,
  isRevoking,
  onConfirm,
  onCancel,
}: Readonly<RevokeQuestionProps>) {
  return (
    <div className="m-5.25 flex flex-col p-3.5">
      <AkTypography data-test-integration-revoke-question>{question}</AkTypography>

      <div className="flex gap-2.75 pt-7">
        <AkButton loading={isRevoking} onClick={onConfirm} data-test-integration-revoke-confirm>
          {akMT('yesDisconnect')}
        </AkButton>

        <AkButton
          variant="outlined"
          color="neutral"
          onClick={onCancel}
          data-test-integration-revoke-cancel
        >
          {akMT('cancel')}
        </AkButton>
      </div>
    </div>
  );
}
