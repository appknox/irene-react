import { useId } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

interface MfaOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * The field a one-time code is typed into.
 *
 * irene checks nothing about the code but that it is there, and says so in a
 * notification rather than under the field, so this is a plain controlled
 * input rather than a form field with its own validation.
 *
 * @param props.value - The code typed so far.
 * @param props.onChange - Called with the code as it is typed.
 * @param props.label - Shown above the field. Without one, the field is still named for a screen reader.
 */
export function MfaOtpInput({ value, onChange, label }: Readonly<MfaOtpInputProps>) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.75">
      {label && <AkLabel htmlFor={id}>{label}</AkLabel>}

      <AkInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label ? undefined : akMT('modalCard.enableMFAEmail.enterCode')}
        autoComplete="one-time-code"
        inputMode="numeric"
        autoFocus
        data-test-mfa-otp-input
      />
    </div>
  );
}
