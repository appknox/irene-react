import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { MfaService } from '@irene/api/services/mfa';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkModalBody } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  isOtpRefusal,
  notifyOtpStepFailed,
  sendOtpIfTyped,
} from '@/features/account-settings/pages/security/utils';

import { mfaKeys } from '@/features/account-settings/queries/mfa';

import { MfaModal, MfaModalFooter } from './mfa-modal';
import { MfaOtpInput } from './mfa-otp-input';

interface MfaDisableProps {
  email: string;
  isEmailMfaEnabled: boolean;
  isAppMfaEnabled: boolean;
  canDisableMfa: boolean;
  onClose: () => void;
}

/**
 * Turns the active second factor off, once a code from it confirms the request.
 *
 * For email, a first step says where the code will go, and Continue asks the
 * server to send it: it emails one and refuses the request with an `otp`
 * error, which is the expected answer, not a failure. For the app there is
 * nothing to send, so the modal opens on the code. irene opens both on the
 * email notice, which tells an app user to expect an email that never comes.
 *
 * One of irene's quirks is kept so the screens match: the code step repeats
 * the notice that MFA cannot be disabled. The notice is irene's fallback for
 * an account that may not disable MFA, which never reaches this modal, and
 * irene's own tests assert it on the code step.
 *
 * @param props.email - The account's address, which the email confirmation step names.
 * @param props.isEmailMfaEnabled - Whether email is the active factor.
 * @param props.isAppMfaEnabled - Whether an authenticator app is.
 * @param props.canDisableMfa - Whether the organization lets this account turn MFA off.
 * @param props.onClose - Called when the modal closes, whether or not MFA was turned off.
 */
export function MfaDisable({
  email,
  isEmailMfaEnabled,
  isAppMfaEnabled,
  canDisableMfa,
  onClose,
}: Readonly<MfaDisableProps>) {
  const queryClient = useQueryClient();
  /* Only email has anything to send first, so the app opens on the code. */
  const [isCodeStep, setIsCodeStep] = useState(!isEmailMfaEnabled);
  const [otp, setOtp] = useState('');

  /* irene checks email first, so an account somehow on both disables email. */
  const enabledMethod = isEmailMfaEnabled
    ? ENUMS.MFA_METHOD.HOTP
    : isAppMfaEnabled
      ? ENUMS.MFA_METHOD.TOTP
      : ENUMS.MFA_METHOD.NONE;

  const sendCode = useMutation({
    mutationFn: async () => {
      try {
        await MfaService.disableMfa({ method: ENUMS.MFA_METHOD.HOTP });
      } catch (error) {
        /* The refusal asking for the code is the server saying it sent one. */
        if (!isOtpRefusal(error)) {
          throw error;
        }
      }
    },

    onSuccess: () => setIsCodeStep(true),

    onError: () => {
      onClose();
      akNotify.error(akMT('somethingWentWrong'));
    },
  });

  const verifyCode = useMutation({
    mutationFn: () => MfaService.disableMfa({ method: enabledMethod, otp }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaKeys.methods() });
      onClose();
    },

    onError: notifyOtpStepFailed,
  });

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendOtpIfTyped(otp, () => verifyCode.mutate());
  };

  const isConfirmStep = !isCodeStep && canDisableMfa;

  return (
    <MfaModal title={akMT('modalCard.mfaTitle.disable')} onClose={onClose}>
      <form noValidate onSubmit={submitCode}>
        <AkModalBody className="flex flex-col">
          {isConfirmStep ? (
            <AkTypography data-test-mfa-disable-send-confirm>
              {akMT('modalCard.enableMFAEmail.sendMailMsg', { email })}
            </AkTypography>
          ) : (
            <AkAlert variant="success" className="mb-3.5 w-112.5" data-test-mfa-disable-denied>
              <AkIcon name="material-symbols:security" />

              <AkAlertDescription>{akMT('disableMFADenied')}</AkAlertDescription>
            </AkAlert>
          )}

          {isCodeStep && (
            <div className="flex flex-col gap-5.25">
              <AkTypography data-test-mfa-disable-desc>
                {[
                  akMT('modalCard.disableMFA.enterOTP'),
                  isEmailMfaEnabled && akMT('modalCard.disableMFA.viaEmail'),
                  isAppMfaEnabled && akMT('modalCard.disableMFA.viaApp'),
                ]
                  .filter(Boolean)
                  .join(' ')}
              </AkTypography>

              <MfaOtpInput value={otp} onChange={setOtp} />
            </div>
          )}
        </AkModalBody>

        {isConfirmStep && (
          <MfaModalFooter>
            <AkButton type="button" loading={sendCode.isPending} onClick={() => sendCode.mutate()}>
              {akMT('continue')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={onClose}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        )}

        {isCodeStep && (
          <MfaModalFooter>
            <AkButton type="submit" loading={verifyCode.isPending}>
              {akMT('confirm')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={onClose}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        )}
      </form>
    </MfaModal>
  );
}
