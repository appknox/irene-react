import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { AuthService } from '@irene/api/services/auth';
import { getApiFieldErrors } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildResetPasswordSchema,
  type ResetPasswordFormSchema,
} from '@/features/auth/schemas/reset-password';

import { BackToLogin } from '@/features/auth/components/back-to-login';
import { useRequiredField } from '@/features/auth/hooks/use-required-field';
import { resetTokenOptions } from '@/features/auth/queries/reset-token';
import { AuthLayout } from '@/layouts/auth-layout';

const resetRoute = getRouteApi('/_unauthenticated/reset/$token');

/**
 * Sets a new password from an emailed link.
 *
 * The link is checked before the form is offered, so a spent or unknown token
 * says so rather than failing only once the user has typed a password twice.
 */
export function ResetPasswordPage() {
  const { token } = resetRoute.useParams();

  const navigate = useNavigate();
  const link = useQuery(resetTokenOptions(token));

  const resetForm = useForm<ResetPasswordFormSchema>({
    resolver: zodResolver(buildResetPasswordSchema()),
    defaultValues: { password: '', confirmPassword: '' },
    reValidateMode: 'onSubmit',
  });

  const hasNoPassword = useRequiredField<ResetPasswordFormSchema>('password', resetForm);
  const hasNoConfirmation = useRequiredField<ResetPasswordFormSchema>('confirmPassword', resetForm);

  const reset = useMutation({
    mutationFn: (values: ResetPasswordFormSchema) =>
      AuthService.resetPassword({ token, ...values }),

    onSuccess: async () => {
      await navigate({ to: '/login' });
      akNotify.success(akMT('passwordIsReset'));
    },

    onError: (error) => {
      const messages = getApiFieldErrors<'password'>(error);
      const passwordMessage = messages.password?.[0];

      if (passwordMessage) {
        resetForm.setError('password', { message: passwordMessage });
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    },
  });

  return (
    <AuthLayout footer={<BackToLogin />}>
      <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-5 text-xl">
        <AkMessageTranslate id="resetPasswordLabel" />
      </AkTypography>

      {link.isPending && <ResetFormSkeleton />}

      {link.isError && (
        <AkTypography fontWeight="medium" data-test-invalid-reset-link>
          <AkMessageTranslate id="invalidPasswordResetLink" />
        </AkTypography>
      )}

      {link.isSuccess && (
        <AkFormProvider {...resetForm}>
          <form
            noValidate
            className="flex flex-col gap-5"
            onSubmit={resetForm.handleSubmit((values) => reset.mutate(values))}
          >
            <AkFormField name="password" label={akMT('newPassword')}>
              <AkInput
                type="password"
                autoComplete="new-password"
                placeholder={akMT('enterNewPassword')}
                autoFocus
                data-test-new-password-input
              />
            </AkFormField>

            <AkFormField name="confirmPassword" label={akMT('confirmPassword')}>
              <AkInput
                type="password"
                autoComplete="new-password"
                placeholder={akMT('enterConfirmPassword')}
                data-test-confirm-password-input
              />
            </AkFormField>

            <AkButton
              type="submit"
              loading={reset.isPending}
              disabled={hasNoPassword || hasNoConfirmation}
              data-test-reset-submit-button
            >
              <AkMessageTranslate id="reset" />
            </AkButton>
          </form>
        </AkFormProvider>
      )}
    </AuthLayout>
  );
}

/** Holds the form's shape while the link is checked, so nothing jumps when it arrives. */
function ResetFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy data-test-reset-form-skeleton>
      <span className="sr-only">{akMT('loading')}</span>

      {[0, 1].map((field) => (
        <div key={field} className="grid gap-1.5">
          <AkSkeleton width="8rem" height="1rem" />
          <AkSkeleton height="2.25rem" />
        </div>
      ))}

      <AkSkeleton height="2.25rem" />
    </div>
  );
}
