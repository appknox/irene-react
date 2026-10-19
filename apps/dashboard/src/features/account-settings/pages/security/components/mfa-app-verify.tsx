import { QRCodeSVG } from 'qrcode.react';
import { type FormEvent } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

import { MfaOtpInput } from './mfa-otp-input';

interface MfaAppVerifyProps {
  secret: string;
  email: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  isVerifying: boolean;
}

/**
 * Sets an authenticator app up: the code to scan, then the first code it shows.
 *
 * The QR code carries the standard `otpauth://` URI irene builds, with the
 * address unescaped as irene leaves it, so an app set up from either reads the
 * same account name.
 *
 * @param props.secret - The TOTP secret the server generated.
 * @param props.email - The account's address, which names the entry in the app.
 * @param props.otp - The code typed so far.
 * @param props.onOtpChange - Called with the code as it is typed.
 * @param props.onContinue - Called to submit the code.
 * @param props.onCancel - Called to give up.
 * @param props.isVerifying - Whether the code is being checked.
 */
export function MfaAppVerify({
  secret,
  email,
  otp,
  onOtpChange,
  onContinue,
  onCancel,
  isVerifying,
}: Readonly<MfaAppVerifyProps>) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <div className="flex w-112.5 flex-col">
      <div className="flex flex-col items-center gap-3.5">
        <AkTypography variant="subtitle1" data-test-mfa-appverify-title>
          {akMT('modalCard.enableMFAApp.scanBarcode')}
        </AkTypography>

        <QRCodeSVG
          value={`otpauth://totp/Appknox:${email}?secret=${secret}&issuer=Appknox`}
          size={300}
          level="H"
          marginSize={4}
          role="img"
          aria-label={akMT('modalCard.enableMFAApp.scanBarcode')}
          data-test-mfa-appverify-qrcode
        />
      </div>

      <form noValidate className="flex flex-col gap-3.5" onSubmit={submit}>
        <AkTypography color="textSecondary">
          {akMT('modalCard.enableMFAApp.enterCode')}
        </AkTypography>

        <MfaOtpInput value={otp} onChange={onOtpChange} />

        <div className="flex items-center justify-end gap-2.5">
          <AkButton type="submit" loading={isVerifying} data-test-mfa-appverify-continue-button>
            {akMT('continue')}
          </AkButton>

          <AkButton type="button" variant="outlined" color="neutral" onClick={onCancel}>
            {akMT('cancel')}
          </AkButton>
        </div>
      </form>
    </div>
  );
}

/** Stands in for the code to scan while the secret is on its way, shaped as the step it becomes. */
export function MfaAppVerifySkeleton() {
  return (
    <div className="flex w-112.5 flex-col" data-test-mfa-appverify-loading>
      <div className="flex flex-col items-center gap-3.5">
        <AkSkeleton height="28px" width="340px" />

        <AkSkeleton height="250px" width="250px" className="m-5.25" />
      </div>

      <AkSkeleton height="38px" />

      <AkSkeleton height="35px" className="mt-3.5" />

      <div className="mt-3.5 flex items-center justify-end gap-2.5">
        <AkSkeleton height="35px" width="80px" />

        <AkSkeleton height="35px" width="80px" />
      </div>
    </div>
  );
}
