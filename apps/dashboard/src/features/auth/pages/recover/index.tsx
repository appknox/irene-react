import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { AuthService } from '@irene/api/services/auth';
import { getApiFieldErrors, unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildRecoverSchema,
  RecoverFormField,
  type RecoverFormSchema,
} from '@/features/auth/schemas/recover';

import { BackToLogin } from '@/features/auth/components/back-to-login';
import { useRequiredField } from '@/features/auth/hooks/use-required-field';
import { AuthLayout } from '@/layouts/auth-layout';

/**
 * Asks which account to reset, then tells the user to go and read their email.
 *
 * The page never says whether the account exists: that would let anyone probe
 * for valid usernames, so a sent link looks the same either way.
 */
export function RecoverPage() {
  const recoverForm = useForm<RecoverFormSchema>({
    resolver: zodResolver(buildRecoverSchema()),
    defaultValues: { username: '' },
    reValidateMode: 'onSubmit',
  });

  const usernameFieldIsEmpty = useRequiredField<RecoverFormSchema>('username', recoverForm);

  const recover = useMutation({
    mutationFn: ({ username }: RecoverFormSchema) => AuthService.recoverPassword(username),
    onError: unlessRateLimited((error) => {
      const messages = getApiFieldErrors<'username'>(error);
      const usernameMessage = messages.username?.[0];

      if (usernameMessage) {
        recoverForm.setError('username', { message: usernameMessage });
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    }),
  });

  return (
    <AuthLayout footer={!recover.isSuccess && <BackToLogin />}>
      <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-5 text-xl">
        <AkMessageTranslate id="resetPasswordLabel" />
      </AkTypography>

      {recover.isSuccess ? (
        <div className="flex flex-col gap-3" data-test-reset-link-sent>
          <AkTypography fontWeight="medium">
            <AkMessageTranslate id="resetPasswordMessageToCheck" />
          </AkTypography>

          <AkTypography color="textSecondary">
            <AkMessageTranslate id="resetPasswordMessageToRetry" />
          </AkTypography>
        </div>
      ) : (
        <AkFormProvider {...recoverForm}>
          <form
            noValidate
            className="flex flex-col gap-5"
            onSubmit={recoverForm.handleSubmit((values) => recover.mutate(values))}
          >
            <RecoverFormField name="username" label={akMT('usernameEmailIdTextLabel')}>
              <AkInput
                autoComplete="username"
                placeholder={akMT('usernameEmailIdTextPlaceholder')}
                autoFocus
                data-test-recover-username-input
              />
            </RecoverFormField>

            <AkButton
              type="submit"
              loading={recover.isPending}
              disabled={usernameFieldIsEmpty}
              data-test-recover-submit-button
            >
              <AkMessageTranslate id="resetPassword" />
            </AkButton>
          </form>
        </AkFormProvider>
      )}
    </AuthLayout>
  );
}
