import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthService, type ApiMfaRequirement } from '@irene/api/services/auth';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { LoginCheckType } from '@/features/auth/components/login-check-type';
import { LoginPerformMfa } from '@/features/auth/components/login-perform-mfa';
import { LoginViaPassword } from '@/features/auth/components/login-via-password';
import { LoginViaSso } from '@/features/auth/components/login-via-sso';
import { RegistrationFooter } from '@/features/auth/components/registration-footer';
import { resolveLoginSchema, type LoginFormSchema } from '@/features/auth/schemas/login';
import { useWhitelabel } from '@/hooks/use-whitelabel';
import { AuthLayout } from '@/layouts/auth-layout';

const loginRoute = getRouteApi('/_unauthenticated/login');

/**
 * Holds what every step of the login flow shares — the form, and the check that
 * decides which step to show. Each step owns its own request and error state.
 */
export function LoginPage() {
  const [mfaRequirement, setMfaRequirement] = useState<ApiMfaRequirement | null>(null);

  const { unauthenticated, ssoLoginError, sessionExpired, userInactive } = loginRoute.useSearch();
  const { showRegistrationLink } = useWhitelabel();
  const navigate = useNavigate();

  const ssoCheck = useMutation({
    mutationFn: ({ username }: LoginFormSchema) => AuthService.checkSso(username),
    onError: unlessRateLimited(() => akNotify.error(akMT('pleaseTryAgain'))),
  });

  const checkData = ssoCheck.data;
  const isSsoEnabled = Boolean(checkData?.is_saml || checkData?.is_oidc);
  const isSsoEnforced = isSsoEnabled && Boolean(checkData?.is_sso_enforced);
  const showPasswordLoginOnly = ssoCheck.isSuccess && !isSsoEnforced && !mfaRequirement;

  const notSignedInReason =
    ssoLoginError ??
    (userInactive ? akMT('loginFailed') : null) ??
    (sessionExpired ? akMT('pleaseLoginAgain') : null) ??
    (unauthenticated ? akMT('pleaseLogin') : null);

  // Each step requires one more field than the last.
  const loginForm = useForm<LoginFormSchema>({
    resolver: zodResolver(resolveLoginSchema(ssoCheck.isSuccess && !isSsoEnforced, mfaRequirement)),
    defaultValues: { username: '', password: '', otp: '' },
    reValidateMode: 'onSubmit',
  });

  // A new username needs a new check, so go back to the first step. That
  // unmounts the step below, dropping whatever it learnt about the account.
  const onUsernameChange = () => {
    ssoCheck.reset();
    setMfaRequirement(null);

    loginForm.clearErrors();
    loginForm.resetField('password');
    loginForm.resetField('otp');
  };

  return (
    <AuthLayout footer={showRegistrationLink && <RegistrationFooter />}>
      {notSignedInReason && (
        <div className="mb-5">
          <AkAlert
            variant="error"
            onDismiss={() => navigate({ to: '/login' })}
            data-test-not-signed-in-alert
          >
            <AkAlertDescription>{notSignedInReason}</AkAlertDescription>
          </AkAlert>
        </div>
      )}

      <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-5 text-xl">
        <AkMessageTranslate id="loginTitle" />
      </AkTypography>

      {/* The form's context is shared with every child login component through AkFormProvider and useFormContext */}
      <AkFormProvider {...loginForm}>
        {!ssoCheck.isSuccess && (
          <LoginCheckType
            loading={ssoCheck.isPending}
            onSubmit={(values) => ssoCheck.mutate(values)}
          />
        )}

        {checkData && isSsoEnforced && (
          <LoginViaSso accountCheckStatus={checkData} onUsernameChange={onUsernameChange} />
        )}

        {mfaRequirement && <LoginPerformMfa mfaRequirement={mfaRequirement} />}

        {checkData && showPasswordLoginOnly && (
          <LoginViaPassword
            check={checkData}
            isSsoEnabled={isSsoEnabled}
            onUsernameChange={onUsernameChange}
            onMfaRequired={setMfaRequirement}
          />
        )}
      </AkFormProvider>
    </AuthLayout>
  );
}
