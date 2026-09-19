import { akMT } from '@irene/translations/intl';
import { AkFormField } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface LoginUsernameFieldProps {
  hasError?: boolean;
  autoFocus?: boolean;
  onChange?: () => void;
}

/**
 * The username or email field, shared by every step of the login flow.
 *
 * @param props.hasError - Colours the border without showing a message.
 * @param props.autoFocus - Focuses the field on mount.
 * @param props.onChange - Runs after the form records the new value.
 */
export const LoginUsernameField = (props: Readonly<LoginUsernameFieldProps>) => {
  const { hasError, autoFocus, onChange } = props;

  return (
    <AkFormField name="username" label={akMT('usernameEmailIdTextLabel')}>
      <AkInput
        autoComplete="username"
        placeholder={akMT('usernameEmailIdTextPlaceholder')}
        hasError={hasError}
        onChange={onChange}
        autoFocus={autoFocus}
        data-test-login-username-input
      />
    </AkFormField>
  );
};
