import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { MfaOtpInput } from './mfa-otp-input';

interface MfaEmailCodeProps {
  email: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Says where the emailed code went, and takes it.
 *
 * @param props.email - The address the code was sent to.
 * @param props.value - The code typed so far.
 * @param props.onChange - Called with the code as it is typed.
 */
export function MfaEmailCode({ email, value, onChange }: Readonly<MfaEmailCodeProps>) {
  return (
    <div className="flex flex-col gap-5.25">
      <div className="rounded-sm bg-divider px-4 py-3" data-test-mfa-email-sent>
        <AkTypography>{akMT('modalCard.enableMFAEmail.description', { email })}</AkTypography>
      </div>

      <MfaOtpInput
        label={akMT('modalCard.enableMFAEmail.enterCode')}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
