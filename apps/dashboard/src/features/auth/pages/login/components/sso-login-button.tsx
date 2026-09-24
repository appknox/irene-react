import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';

interface SsoLoginButtonProps {
  isEnforced?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Sends the user to their identity provider.
 *
 * @param props.isEnforced - Whether the organisation allows nothing but SSO.
 * @param props.loading - Whether the redirect is being prepared.
 * @param props.onClick - Starts the redirect.
 */
export function SsoLoginButton(props: Readonly<SsoLoginButtonProps>) {
  const { isEnforced = false, loading, onClick } = props;

  return (
    <AkButton
      type={isEnforced ? 'submit' : 'button'}
      loading={loading}
      onClick={onClick}
      className="w-full"
      data-test-sso-login-button
    >
      <AkMessageTranslate id="ssoLogin" />
    </AkButton>
  );
}
