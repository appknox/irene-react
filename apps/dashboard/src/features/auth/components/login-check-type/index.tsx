import { useFormContext } from 'react-hook-form';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';

import { LoginUsernameField } from '@/features/auth/components/login-username-field';
import { useRequiredField } from '@/features/auth/hooks/use-required-field';
import type { LoginFormSchema } from '@/features/auth/schemas/login';

/**
 * ===============================================
 * TYPES
 * ===============================================
 */
interface LoginCheckTypeProps {
  loading: boolean;
  onSubmit: (values: LoginFormSchema) => void;
}

/**
 * The first step: the username alone, which decides whether the account signs
 * in with a password, with SSO, or with both.
 *
 * @param props.loading - Whether the check is in flight.
 * @param props.onSubmit - Runs the check.
 */
export function LoginCheckType({ loading, onSubmit }: Readonly<LoginCheckTypeProps>) {
  const { handleSubmit } = useFormContext<LoginFormSchema>(); // The form lives in LoginPage, shared with every step through AkFormProvider.
  const isUsernameEmpty = useRequiredField<LoginFormSchema>('username');

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <LoginUsernameField autoFocus />

      <AkButton
        type="submit"
        loading={loading}
        disabled={isUsernameEmpty}
        data-test-login-next-button
      >
        <AkMessageTranslate id="next" />
      </AkButton>
    </form>
  );
}
