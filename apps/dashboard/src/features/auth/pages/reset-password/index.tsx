import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useStore } from 'zustand';

import {
  getApiErrorStatus,
  getApiFieldErrors,
  isRateLimited,
  unlessRateLimited,
} from '@irene/api/utils/errors';

import { AuthService } from '@irene/api/services/auth';
import { rateLimitStore } from '@irene/api/stores/rate-limit';
import { HTTP_STATUS_CODES } from '@irene/constants';
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
  const rateLimitIsActive = useStore(rateLimitStore, (lock) => lock.isThrottled);

  // Token check query
  const tokenCheckRes = useQuery(resetTokenOptions(token));

  const resetForm = useForm<ResetPasswordFormSchema>({
    resolver: zodResolver(buildResetPasswordSchema()),
    defaultValues: { password: '', confirmPassword: '' },
    reValidateMode: 'onSubmit',
  });

  // Token check query errors
  const tokenCheckBrokeTheServer =
    (getApiErrorStatus(tokenCheckRes.error) ?? 0) >= HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

  const tokenCheckWasRateLimited = isRateLimited(tokenCheckRes.error);
  const tokenCheckNeverRan = tokenCheckWasRateLimited || tokenCheckBrokeTheServer;
  const hasNoPassword = useRequiredField<ResetPasswordFormSchema>('password', resetForm);
  const hasNoConfirmation = useRequiredField<ResetPasswordFormSchema>('confirmPassword', resetForm);

  // Password reset mutation
  const reset = useMutation({
    mutationFn: (values: ResetPasswordFormSchema) =>
      AuthService.resetPassword({ token, ...values }),

    onSuccess: async () => {
      await navigate({ to: '/login' });
      akNotify.success(akMT('passwordIsReset'));
    },

    onError: unlessRateLimited((error) => {
      const messages = getApiFieldErrors<'password'>(error);
      const passwordMessage = messages.password?.[0];

      if (passwordMessage) {
        resetForm.setError('password', { message: passwordMessage });
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    }),
  });

  return (
    <AuthLayout footer={<BackToLogin />}>
      <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-3 text-xl">
        <AkMessageTranslate id="resetPasswordLabel" />
      </AkTypography>

      {tokenCheckRes.isPending && <ResetFormSkeleton />}

      {tokenCheckRes.isError && !tokenCheckNeverRan && (
        <AkTypography fontWeight="medium" data-test-invalid-reset-link>
          <AkMessageTranslate id="invalidPasswordResetLink" />
        </AkTypography>
      )}

      {tokenCheckRes.isError && tokenCheckNeverRan && (
        <div className="flex flex-col items-start gap-4" data-test-reset-link-uncheckable>
          <AkTypography color="textSecondary">
            {tokenCheckWasRateLimited ? akMT('resetLinkRateLimited') : akMT('somethingWentWrong')}
          </AkTypography>

          <AkButton
            className="w-full"
            onClick={() => tokenCheckRes.refetch()}
            loading={tokenCheckRes.isFetching}
            disabled={rateLimitIsActive}
            data-test-reset-link-retry-button
          >
            <AkMessageTranslate id="retry" />
          </AkButton>
        </div>
      )}

      {tokenCheckRes.isSuccess && (
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
