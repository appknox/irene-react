import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { MfaService, type ApiMfaSetupToken } from '@irene/api/services/mfa';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkModalBody } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  isOtpRefusal,
  notifyOtpStepFailed,
  sendOtpIfTyped,
} from '@/features/account-settings/pages/security/utils';

import { mfaKeys } from '@/features/account-settings/queries/mfa';

import { MfaAppVerify } from './mfa-app-verify';
import { MfaEmailCode } from './mfa-email-code';
import { MfaModal, MfaModalFooter } from './mfa-modal';
import { useMfaModal } from './use-mfa-modal';

type SwitchToAppStep = 'confirm' | 'email';

interface MfaSwitchToAppProps {
  email: string;
  onClose: () => void;
}

/**
 * Moves an account from email MFA to an authenticator app.
 *
 * The account proves it still holds the email factor first: asking for the
 * app makes the server email a code and refuse with an `otp` error, which is
 * the cue to take that code. The code buys the new secret, and the first code
 * the app shows completes the switch. A request that is not refused leaves the
 * modal where it is, as irene's does; the server always refuses it for an
 * account on email MFA.
 *
 * @param props.email - The account's address, where the code goes.
 * @param props.onClose - Called when the modal closes, whether or not the switch completed.
 */
export function MfaSwitchToApp({ email, onClose }: Readonly<MfaSwitchToAppProps>) {
  const { closeModal, modalProps } = useMfaModal(onClose);

  const queryClient = useQueryClient();
  const [step, setStep] = useState<SwitchToAppStep>('confirm');
  const [emailOtp, setEmailOtp] = useState('');
  const [appOtp, setAppOtp] = useState('');
  /* Set once the emailed code is accepted, which moves the modal to the app step. */
  const [appSetup, setAppSetup] = useState<ApiMfaSetupToken | null>(null);

  const requestEmailCode = useMutation({
    mutationFn: () => MfaService.requestMfaSetup({ method: ENUMS.MFA_METHOD.TOTP }),

    onError: unlessRateLimited((error) => {
      if (isOtpRefusal(error)) {
        setStep('email');
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    }),
  });

  const verifyEmailCode = useMutation({
    mutationFn: () => MfaService.requestMfaSetup({ method: ENUMS.MFA_METHOD.TOTP, otp: emailOtp }),

    onSuccess: setAppSetup,

    onError: notifyOtpStepFailed,
  });

  const verifyAppCode = useMutation({
    mutationFn: (token: string) =>
      MfaService.confirmMfa({ method: ENUMS.MFA_METHOD.TOTP, otp: appOtp, token }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaKeys.methods() });
      closeModal();
    },

    onError: notifyOtpStepFailed,
  });

  return (
    <MfaModal title={akMT('mfaSwitchToAppTitle')} {...modalProps}>
      {!appSetup && step === 'confirm' && (
        <>
          <AkModalBody>
            <AkTypography data-test-switch-to-app-desc>
              {akMT('mfaSwitchToAppDescription')}
            </AkTypography>
          </AkModalBody>

          <MfaModalFooter>
            <AkButton
              type="button"
              loading={requestEmailCode.isPending}
              onClick={() => requestEmailCode.mutate()}
            >
              {akMT('continue')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={closeModal}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        </>
      )}

      {!appSetup && step === 'email' && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            sendOtpIfTyped(emailOtp, () => verifyEmailCode.mutate());
          }}
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

      {appSetup && (
        <AkModalBody>
          <MfaAppVerify
            secret={appSetup.secret}
            email={email}
            otp={appOtp}
            onOtpChange={setAppOtp}
            onContinue={() => sendOtpIfTyped(appOtp, () => verifyAppCode.mutate(appSetup.token))}
            onCancel={closeModal}
            isVerifying={verifyAppCode.isPending}
          />
        </AkModalBody>
      )}
    </MfaModal>
  );
}
