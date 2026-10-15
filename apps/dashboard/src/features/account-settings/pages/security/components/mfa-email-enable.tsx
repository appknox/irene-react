import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { MfaService } from '@irene/api/services/mfa';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkModalBody } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  notifyOtpStepFailed,
  sendOtpIfTyped,
} from '@/features/account-settings/pages/security/utils';

import { mfaKeys } from '@/features/account-settings/queries/mfa';

import { MfaEmailCode } from './mfa-email-code';
import { MfaModal, MfaModalFooter } from './mfa-modal';

interface MfaEmailEnableProps {
  email: string;
  onClose: () => void;
}

/**
 * Turns email MFA on for an account with no second factor.
 *
 * It says a code is about to be sent and sends it on Continue, then takes the
 * code. The server hands back a token with the first request, which the second
 * carries so the code is checked against the secret it was made from.
 *
 * @param props.email - The account's address, where the code goes.
 * @param props.onClose - Called when the modal closes, whether or not MFA was turned on.
 */
export function MfaEmailEnable({ email, onClose }: Readonly<MfaEmailEnableProps>) {
  const queryClient = useQueryClient();
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const sendCode = useMutation({
    mutationFn: () => MfaService.requestMfaSetup({ method: ENUMS.MFA_METHOD.HOTP }),

    onSuccess: (setup) => {
      setSetupToken(setup.token);
      akNotify.success(akMT('mfaOtpSentTo', { email }));
    },

    onError: unlessRateLimited(() => akNotify.error(akMT('mfaOtpSendFailed'))),
  });

  const verifyCode = useMutation({
    mutationFn: (token: string) =>
      MfaService.confirmMfa({ method: ENUMS.MFA_METHOD.HOTP, otp, token }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaKeys.methods() });
      onClose();
    },

    onError: notifyOtpStepFailed,
  });

  return (
    <MfaModal title={akMT('modalCard.mfaTitle.enable')} onClose={onClose}>
      {setupToken === null ? (
        <>
          <AkModalBody>
            <AkTypography data-test-mfa-email-enable-send-confirm>
              {akMT('modalCard.enableMFAEmail.sendMailMsg')}
              <strong>{email}</strong>
            </AkTypography>
          </AkModalBody>

          <MfaModalFooter>
            <AkButton type="button" loading={sendCode.isPending} onClick={() => sendCode.mutate()}>
              {akMT('continue')}
            </AkButton>

            <AkButton type="button" variant="outlined" color="neutral" onClick={onClose}>
              {akMT('cancel')}
            </AkButton>
          </MfaModalFooter>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            sendOtpIfTyped(otp, () => verifyCode.mutate(setupToken));
          }}
        >
          <AkModalBody>
            <MfaEmailCode email={email} value={otp} onChange={setOtp} />
          </AkModalBody>

          <MfaModalFooter>
            <AkButton type="submit" loading={verifyCode.isPending}>
              {akMT('confirm')}
            </AkButton>
          </MfaModalFooter>
        </form>
      )}
    </MfaModal>
  );
}
