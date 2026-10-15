import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { MfaService } from '@irene/api/services/mfa';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkModalBody } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  notifyOtpStepFailed,
  sendOtpIfTyped,
} from '@/features/account-settings/pages/security/utils';

import { mfaKeys } from '@/features/account-settings/queries/mfa';

import { MfaEmailCode } from './mfa-email-code';
import { MfaModal, MfaModalFooter } from './mfa-modal';
import { MfaOtpInput } from './mfa-otp-input';

type SwitchToEmailStep = 'confirm' | 'app';

interface MfaSwitchToEmailProps {
  email: string;
  onClose: () => void;
}

/**
 * Moves an account from an authenticator app to email MFA.
 *
 * The account proves it still holds the app first: a code from it makes the
 * server email a code and hand back a token, and that emailed code, sent with
 * the token, completes the switch.
 *
 * @param props.email - The account's address, where the code goes.
 * @param props.onClose - Called when the modal closes, whether or not the switch completed.
 */
export function MfaSwitchToEmail({ email, onClose }: Readonly<MfaSwitchToEmailProps>) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<SwitchToEmailStep>('confirm');
  const [appOtp, setAppOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  /* Set once the app's code is accepted, which moves the modal to the email step. */
  const [emailToken, setEmailToken] = useState<string | null>(null);

  const verifyAppCode = useMutation({
    mutationFn: () => MfaService.requestMfaSetup({ method: ENUMS.MFA_METHOD.HOTP, otp: appOtp }),

    onSuccess: (setup) => setEmailToken(setup.token),

    onError: notifyOtpStepFailed,
  });

  const verifyEmailCode = useMutation({
    mutationFn: (token: string) =>
      MfaService.confirmMfa({ method: ENUMS.MFA_METHOD.HOTP, otp: emailOtp, token }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaKeys.methods() });
      onClose();
    },

    onError: notifyOtpStepFailed,
  });

  /** Keeps the form from navigating, and sends the code once one is typed. */
  const submitOtp = (event: FormEvent<HTMLFormElement>, otp: string, send: () => void) => {
    event.preventDefault();
    sendOtpIfTyped(otp, send);
  };

  return (
    <MfaModal title={akMT('mfaSwitchToEmailTitle')} onClose={onClose}>
      {!emailToken && step === 'confirm' && (
        <>
          <AkModalBody>
            <AkTypography data-test-switch-to-email-desc>
              {akMT('mfaSwitchToEmailDescription')}
            </AkTypography>
          </AkModalBody>

          <MfaModalFooter>
            <AkButton type="button" onClick={() => setStep('app')}>
              {akMT('continue')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={onClose}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        </>
      )}

      {!emailToken && step === 'app' && (
        <form
          noValidate
          onSubmit={(event) => submitOtp(event, appOtp, () => verifyAppCode.mutate())}
        >
          <AkModalBody className="flex flex-col gap-5.25">
            <AkTypography data-test-switch-to-email-app-verify>
              {`${akMT('modalCard.disableMFA.enterOTP')} ${akMT('modalCard.disableMFA.viaApp')}`}
            </AkTypography>

            <MfaOtpInput value={appOtp} onChange={setAppOtp} />
          </AkModalBody>

          <MfaModalFooter>
            <AkButton type="submit" loading={verifyAppCode.isPending}>
              {akMT('confirm')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={onClose}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        </form>
      )}

      {emailToken && (
        <form
          noValidate
          onSubmit={(event) => submitOtp(event, emailOtp, () => verifyEmailCode.mutate(emailToken))}
        >
          <AkModalBody>
            <MfaEmailCode email={email} value={emailOtp} onChange={setEmailOtp} />
          </AkModalBody>

          <MfaModalFooter>
            <AkButton type="submit" loading={verifyEmailCode.isPending}>
              {akMT('confirm')}
            </AkButton>
          </MfaModalFooter>
        </form>
      )}
    </MfaModal>
  );
}
