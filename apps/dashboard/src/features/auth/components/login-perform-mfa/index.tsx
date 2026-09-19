import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormField } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiMfaRequirement } from '@irene/api/services/auth';

import { LoginRefusalMessage } from '@/features/auth/components/login-refusal-message';
import { PasswordResetButton } from '@/features/auth/components/password-reset-button';
import { useRequiredField } from '@/features/auth/hooks/use-required-field';
import { useLogin } from '@/features/auth/pages/login/hooks/use-login';
import { isLockedOrCredentialsFailure, LoginFailureKind } from '@/features/auth/utils/login-error';
import type { LoginFormSchema } from '@/features/auth/schemas/login';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface LoginPerformMfaProps {
  mfaRequirement: ApiMfaRequirement;
}

/**
 * The second-factor step. The password was accepted; this sends it again with
 * the code, since the API signs the user in on one request.
 *
 * @param props.mfaRequirement - Which factor the account uses, and whether it is mandated.
 */
export function LoginPerformMfa({ mfaRequirement }: Readonly<LoginPerformMfaProps>) {
  // The form lives in LoginPage, shared with every step through AkFormProvider.
  const { handleSubmit } = useFormContext<LoginFormSchema>();
  const { login, failure } = useLogin();
  const hasNoMfaCode = useRequiredField<LoginFormSchema>('otp');

  const isLocked = failure?.kind === LoginFailureKind.LOCKED;
  const loginRefusal = isLockedOrCredentialsFailure(failure);

  const { type: mfaType, forced: mfaIsForced } = mfaRequirement;
  const isEmailMFA = mfaType === 'HOTP';
  const isTotpMFA = mfaType === 'TOTP';
  const mfaIsMandatory = mfaIsForced?.toLowerCase() === 'true';
  const mfaInputLabel = isTotpMFA ? akMT('authenticatorCodeLabel') : akMT('emailCodeLabel');

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={handleSubmit((values) => login.mutate(values))}
    >
      <div className="flex flex-col gap-1">
        {mfaIsMandatory && (
          <AkTypography data-test-mfa-org-mandated>
            <AkMessageTranslate id="organizationMandatory2FA" />
          </AkTypography>
        )}

        {isEmailMFA ? (
          <Fragment>
            <AkTypography data-test-mfa-email-otp>
              <AkMessageTranslate id="emailOTP" />
            </AkTypography>

            <AkTypography>
              <AkMessageTranslate id="emailCode" />
            </AkTypography>
          </Fragment>
        ) : (
          <AkTypography data-test-mfa-authenticator-code>
            <AkMessageTranslate id="authenticatorCode" />
          </AkTypography>
        )}
      </div>

      <AkFormField name="otp" label={mfaInputLabel}>
        <AkInput
          placeholder={akMT('enterCode')}
          hasError={loginRefusal}
          errorMessage={loginRefusal ? <LoginRefusalMessage failure={failure} /> : undefined}
          autoComplete="one-time-code"
          autoFocus
          data-test-mfa-otp-input
        />
      </AkFormField>

      {isLocked ? (
        <PasswordResetButton />
      ) : (
        <AkButton
          type="submit"
          loading={login.isPending}
          disabled={hasNoMfaCode}
          data-test-mfa-submit-button
        >
          <AkMessageTranslate id="verify" />
        </AkButton>
      )}
    </form>
  );
}
