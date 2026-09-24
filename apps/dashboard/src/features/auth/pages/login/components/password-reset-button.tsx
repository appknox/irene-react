import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';

/**
 * Replaces the submit button once an account is locked out, since another
 * attempt cannot clear it.
 */
export function PasswordResetButton() {
  return (
    <AkButton asChild data-test-password-reset-button>
      <Link to="/recover">
        <AkMessageTranslate id="resetPassword" />
      </Link>
    </AkButton>
  );
}
