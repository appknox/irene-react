import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';

import { RegistrationService } from '@irene/api/services/registration';
import { getApiFieldErrors, unlessRateLimited } from '@irene/api/utils/errors';
import { getConfigValue } from '@irene/config';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { BackToLogin } from '@/features/auth/components/back-to-login';
import { RegisterCompanyFooter } from '@/features/auth/components/register-company-footer';
import { buildRegisterSchema, type RegisterFormSchema } from '@/features/auth/schemas/register';
import { AuthLayout } from '@/layouts/auth-layout';
import { setFormFieldErrors, toFormFieldErrors } from '@/utils/form-field-errors';

/** The fields the API reports errors against. */
type RegisterFieldError = 'email' | 'company' | 'recaptcha';

// The action the token is scored against, which the backend checks it for.
const RECAPTCHA_ACTION = 'registration';

// What the backend accepts in place of a token where the check is switched off.
const RECAPTCHA_DISABLED = 'notenabled';

/**
 * Opens an account, which the backend confirms by email.
 *
 * The same answer comes back whether or not the address already has an account,
 * so the page cannot be used to find out who has one.
 */
export function RegisterPage() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const registerSchema = buildRegisterSchema();

  const registerForm = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', company: '' },
    reValidateMode: 'onSubmit',
  });

  // Mutation to register the account.
  const register = useMutation<void, Error, RegisterFormSchema>({
    mutationFn: async ({ email, company }) => {
      /* Scores the visit rather than asking anything, so the token is issued as the form is sent. */
      const recaptcha = executeRecaptcha
        ? await executeRecaptcha(RECAPTCHA_ACTION)
        : RECAPTCHA_DISABLED;

      const requestBody = {
        recaptcha,
        email,
        company,
        first_name: '',
        last_name: '',
      };

      return RegistrationService.register(requestBody);
    },

    onError: unlessRateLimited((error) => {
      const messages = getApiFieldErrors<RegisterFieldError>(error);
      const recaptchaMessage = messages.recaptcha?.[0];

      // Show the recaptcha error
      if (recaptchaMessage) {
        akNotify.error(recaptchaMessage);

        return;
      }

      /* A complaint about no field in particular — registration switched off, or a 500. */
      const fieldErrors = toFormFieldErrors<RegisterFormSchema>(registerSchema, error);

      if (fieldErrors.length === 0) {
        akNotify.error(akMT('somethingWentWrong'));
      } else {
        setFormFieldErrors(registerForm, fieldErrors);
      }
    }),
  });

  // If the registration is successful, show the confirmation page.
  if (register.isSuccess) {
    return (
      <AuthLayout footer={<BackToLogin />}>
        <div className="flex flex-col gap-3" data-test-registration-confirm>
          <AkTypography tag="h1" variant="h4" fontWeight="bold" className="text-xl">
            <AkMessageTranslate id="registerConfirmation" />
          </AkTypography>

          <AkTypography color="textSecondary">
            <AkMessageTranslate id="checkEmail" />
          </AkTypography>
        </div>
      </AuthLayout>
    );
  }

  // If the registration is not successful, show the registration form.
  return (
    <AuthLayout footer={<RegisterCompanyFooter />}>
      <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-5 text-xl">
        <AkMessageTranslate id="completeRegistration" />
      </AkTypography>

      <AkFormProvider {...registerForm}>
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={registerForm.handleSubmit((values) => register.mutate(values))}
        >
          <AkFormField name="email" label={akMT('emailId')}>
            <AkInput
              type="email"
              autoComplete="email"
              placeholder={akMT('emailId')}
              autoFocus
              data-test-register-email-input
            />
          </AkFormField>

          <AkFormField name="company" label={akMT('companyName')}>
            <AkInput
              autoComplete="organization"
              placeholder={akMT('companyName')}
              data-test-register-company-input
            />
          </AkFormField>

          <AkButton type="submit" loading={register.isPending} data-test-register-submit-button>
            <AkMessageTranslate id="register" />
          </AkButton>
        </form>
      </AkFormProvider>
    </AuthLayout>
  );
}

/**
 * The registration page, with the reCAPTCHA widget it scores its visitors with.
 *
 * The widget is loaded from recaptcha.net, which is reachable in places
 * google.com is not.
 */
export function RegisterPageWithRecaptcha() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={getConfigValue('IRENE_RECAPTCHA_SITE_KEY')}
      useRecaptchaNet
      scriptProps={{ async: true, defer: true }}
    >
      <RegisterPage />
    </GoogleReCaptchaProvider>
  );
}
