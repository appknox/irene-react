import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkFormField } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiMfaRequirement, ApiSsoCheck } from '@irene/api/services/auth';

import { LoginRefusalMessage } from '@/features/auth/components/login-refusal-message';
import { LoginUsernameField } from '@/features/auth/components/login-username-field';
import { PasswordResetButton } from '@/features/auth/components/password-reset-button';
import { SsoLoginButton } from '@/features/auth/components/sso-login-button';
import { useRequiredField } from '@/features/auth/hooks/use-required-field';
import { useLogin } from '@/features/auth/pages/login/hooks/use-login';
import { useSsoLogin } from '@/features/auth/pages/login/hooks/use-sso-login';
import { isLockedOrCredentialsFailure } from '@/features/auth/utils/login-error';
import type { LoginFormSchema } from '@/features/auth/schemas/login';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface LoginViaPasswordProps {
  check: ApiSsoCheck;
  isSsoEnabled: boolean;
  onUsernameChange: () => void;
  onMfaRequired: (mfaRequirement: ApiMfaRequirement) => void;
}

/**
 * The password step, with the SSO alternative below it when the account has one.
 *
 * A locked account cannot be helped by another attempt, so the password reset
 * replaces both the submit button and the "Forgot Password?" link.
 *
 * @param props.check - What the SSO check said about this account.
 * @param props.isSsoEnabled - Whether to offer the identity provider too.
 * @param props.onUsernameChange - Returns the flow to the first step.
 * @param props.onMfaRequired - Moves the flow on when the account wants a second factor as well.
 */
export function LoginViaPassword({
  check,
  isSsoEnabled,
  onUsernameChange,
  onMfaRequired,
}: Readonly<LoginViaPasswordProps>) {
  // The form lives in LoginPage, shared with every step through AkFormProvider.
  const { handleSubmit, getValues } = useFormContext<LoginFormSchema>();
  const { login, failure: loginFailure } = useLogin({ onMfaRequired });

  const hasNoPassword = useRequiredField<LoginFormSchema>('password');
  const ssoLogin = useSsoLogin(check);

  const isLockedAccount = loginFailure?.kind === 'locked';
  const wasRefused = isLockedOrCredentialsFailure(loginFailure);

  // A refused password is stale as soon as it is edited. A lock is not: another
  // attempt cannot clear it, so the message stays until the username changes.
  const onPasswordChange = () => {
    if (loginFailure?.kind === 'credentials') {
      login.reset();
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={handleSubmit((values) => login.mutate(values))}
    >
      <LoginUsernameField hasError={wasRefused} onChange={onUsernameChange} />

      <AkFormField
        name="password"
        label={<AkMessageTranslate id="password" />}
        labelAction={
          !isLockedAccount && (
            <AkButton variant="text" color="textSecondary" size="sm" noPadding asChild>
              <Link to="/recover" className="h-fit px-0 text-md underline">
                <AkMessageTranslate id="forgotPassword" />
              </Link>
            </AkButton>
          )
        }
      >
        <AkInput
          type="password"
          autoComplete="current-password"
          placeholder={akMT('passwordPlaceholder')}
          hasError={wasRefused}
          errorMessage={wasRefused ? <LoginRefusalMessage failure={loginFailure} /> : undefined}
          onChange={onPasswordChange}
          autoFocus
          data-test-login-password-input
        />
      </AkFormField>

      {isLockedAccount ? (
        <PasswordResetButton />
      ) : (
        <AkButton
          type="submit"
          loading={login.isPending}
          disabled={hasNoPassword}
          data-test-login-submit-button
        >
          <AkMessageTranslate id="login" />
        </AkButton>
      )}

      {isSsoEnabled && (
        <Fragment>
          <div className="flex items-center gap-2">
            <AkDivider color="dark" className="flex-1" />

            <AkTypography tag="span">
              <AkMessageTranslate id="or" />
            </AkTypography>

            <AkDivider color="dark" className="flex-1" />
          </div>

          <SsoLoginButton
            loading={ssoLogin.isPending}
            onClick={() => ssoLogin.start(getValues('username'))}
          />
        </Fragment>
      )}
    </form>
  );
}
