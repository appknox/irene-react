import { useFormContext } from 'react-hook-form';

import type { ApiSsoCheck } from '@irene/api/services/auth';

import { LoginUsernameField } from '@/features/auth/components/login-username-field';
import { SsoLoginButton } from '@/features/auth/components/sso-login-button';
import { useSsoLogin } from '@/features/auth/pages/login/hooks/use-sso-login';
import type { LoginFormSchema } from '@/features/auth/schemas/login';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface LoginViaSsoProps {
  accountCheckStatus: ApiSsoCheck;
  onUsernameChange: () => void;
}

/**
 * The step for an organisation that allows nothing but SSO: no password, just
 * the username and the handover to the identity provider.
 *
 * @param props.accountCheckStatus - What the SSO check said about this account.
 * @param props.onUsernameChange - Returns the flow to the first step.
 */
export function LoginViaSso({ accountCheckStatus, onUsernameChange }: Readonly<LoginViaSsoProps>) {
  // The form lives in LoginPage, shared with every step through AkFormProvider.
  const { handleSubmit } = useFormContext<LoginFormSchema>();
  const ssoLogin = useSsoLogin(accountCheckStatus);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(({ username }) => ssoLogin.start(username))}
    >
      <LoginUsernameField onChange={onUsernameChange} />

      {/* Submits the form, so Enter from the username field starts the redirect too. */}
      <SsoLoginButton isEnforced loading={ssoLogin.isPending} />
    </form>
  );
}
