import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { MfaService } from '@irene/api/services/mfa';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkModalBody } from '@irene/ui/ak-modal';
import { akNotify } from '@irene/ui/notify';

import {
  notifyOtpStepFailed,
  sendOtpIfTyped,
} from '@/features/account-settings/pages/security/utils';

import { mfaKeys } from '@/features/account-settings/queries/mfa';

import { MfaAppVerify, MfaAppVerifySkeleton } from './mfa-app-verify';
import { MfaModal } from './mfa-modal';
import { useMfaModal } from './use-mfa-modal';

interface MfaAppEnableProps {
  email: string;
  onClose: () => void;
}

/**
 * Turns authenticator-app MFA on for an account with no second factor.
 *
 * The secret is asked for as the modal opens, and the QR code is drawn from it.
 * It is a query that is never cached, so each opening gets a secret of its own,
 * as irene's request in the constructor does, and never stale while open, so
 * refocusing the window mid-scan does not swap the code for a new one. A
 * failure closes the modal.
 *
 * @param props.email - The account's address, which names the entry in the app.
 * @param props.onClose - Called when the modal closes, whether or not MFA was turned on.
 */
export function MfaAppEnable({ email, onClose }: Readonly<MfaAppEnableProps>) {
  const { closeModal, modalProps } = useMfaModal(onClose);

  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');

  const setup = useQuery({
    queryKey: [...mfaKeys.all(), 'setup', ENUMS.MFA_METHOD.TOTP],
    queryFn: () => MfaService.requestMfaSetup({ method: ENUMS.MFA_METHOD.TOTP }),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (setup.isError) {
      closeModal();
      akNotify.error(akMT('somethingWentWrong'));
    }
  }, [setup.isError, closeModal]);

  const verifyCode = useMutation({
    mutationFn: (token: string) =>
      MfaService.confirmMfa({ method: ENUMS.MFA_METHOD.TOTP, otp, token }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaKeys.methods() });
      closeModal();
    },

    onError: notifyOtpStepFailed,
  });

  return (
    <MfaModal title={akMT('modalCard.mfaTitle.enable')} {...modalProps}>
      <AkModalBody>
        {setup.data ? (
          <MfaAppVerify
            secret={setup.data.secret}
            email={email}
            otp={otp}
            onOtpChange={setOtp}
            onContinue={() => sendOtpIfTyped(otp, () => verifyCode.mutate(setup.data.token))}
            onCancel={closeModal}
            isVerifying={verifyCode.isPending}
          />
        ) : (
          <MfaAppVerifySkeleton />
        )}
      </AkModalBody>
    </MfaModal>
  );
}
