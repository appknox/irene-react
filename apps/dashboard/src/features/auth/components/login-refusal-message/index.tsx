import { isAppknoxBranded } from '@irene/config';
import { APPKNOX_SUPPORT_EMAIL } from '@irene/constants';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import type { LoginFailure } from '@/features/auth/utils/login-error';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface LoginRefusalMessageProps {
  failure?: LoginFailure;
}

/**
 * What goes under the field a sign-in was refused on. Shared by the password
 * and second-factor steps, which refuse the same two ways.
 *
 * @param props.failure - The refusal to describe.
 * @returns The message, or nothing when the refusal belongs in a toast.
 */
export function LoginRefusalMessage({ failure }: Readonly<LoginRefusalMessageProps>) {
  if (failure?.kind === 'locked') {
    return <AccountLocked />;
  }

  if (failure?.kind === 'credentials') {
    return <AkMessageTranslate id="credentialsIncorrect" />;
  }

  return null;
}

/** Tells the user their account is locked and where to get help. */
function AccountLocked() {
  return (
    <span data-test-account-locked-message>
      <AkMessageTranslate id="lockedAccount" />

      {/* Only Appknox answers its own support address; a whitelabel routes its own. */}
      {isAppknoxBranded() ? (
        <a
          href={`mailto:${APPKNOX_SUPPORT_EMAIL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary underline"
          data-test-contact-support-link
        >
          <AkMessageTranslate id="contactSupport" />
        </a>
      ) : (
        <AkMessageTranslate id="contactSupport" />
      )}
    </span>
  );
}
