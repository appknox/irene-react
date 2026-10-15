import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { AuthService } from '@irene/api/services/auth';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildChangePasswordSchema,
  ChangePasswordFormField,
  type ChangePasswordFormSchema,
} from '@/features/account-settings/schemas/change-password';

import { endSession } from '@/features/auth/actions/session';
import { setFormFieldErrors, toFormFieldErrors } from '@/utils/form-field-errors';

/**
 * Changes the signed-in account's password.
 *
 * The server deletes every token the account holds once the password changes,
 * so this session is over too: it is ended here and the user signs in again
 * with the new password. irene sends them to the login page and lets the next
 * refused request end the session; ending it directly lands in the same place
 * without the "session expired" detour.
 */
export function PasswordChange() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const changePasswordSchema = buildChangePasswordSchema();

  const changePasswordForm = useForm<ChangePasswordFormSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: '', password: '', confirm_password: '' },
    reValidateMode: 'onSubmit',
  });

  const changePassword = useMutation({
    mutationFn: AuthService.changePassword,

    onSuccess: async () => {
      endSession(queryClient);
      await navigate({ to: '/login' });
      router.clearCache();

      akNotify.success(akMT('passwordChanged'));
    },

    /* The server names the field it refuses, so its message goes under that field. */
    onError: unlessRateLimited((error) => {
      const fieldErrors = toFormFieldErrors<ChangePasswordFormSchema>(changePasswordSchema, error);

      if (fieldErrors.length === 0) {
        akNotify.error(akMT('somethingWentWrong'));
      } else {
        setFormFieldErrors(changePasswordForm, fieldErrors);
      }
    }),
  });

  return (
    <AkFormProvider {...changePasswordForm}>
      <form
        noValidate
        className="flex w-87.5 flex-col gap-3.5"
        onSubmit={changePasswordForm.handleSubmit((values) => changePassword.mutate(values))}
        data-test-password-change
      >
        <AkTypography variant="h5">{akMT('changePassword')}</AkTypography>

        <ChangePasswordFormField
          name="old_password"
          label={akMT('currentPassword')}
          labelProps={{ className: 'text-md font-semibold text-foreground-muted' }}
        >
          <AkInput type="password" autoComplete="current-password" />
        </ChangePasswordFormField>

        <ChangePasswordFormField
          name="password"
          label={akMT('newPassword')}
          labelProps={{ className: 'text-md font-semibold text-foreground-muted' }}
        >
          <AkInput type="password" autoComplete="new-password" />
        </ChangePasswordFormField>

        <ChangePasswordFormField
          name="confirm_password"
          label={akMT('confirmPassword')}
          labelProps={{ className: 'text-md font-semibold text-foreground-muted' }}
        >
          <AkInput type="password" autoComplete="new-password" />
        </ChangePasswordFormField>

        <AkButton type="submit" className="mt-1.75 self-start" loading={changePassword.isPending}>
          {akMT('changePassword')}
        </AkButton>
      </form>
    </AkFormProvider>
  );
}
