import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

/** Points the user back at the login page, from a page they reached by email. */
export function BackToLogin() {
  return (
    <div className="flex items-center justify-center gap-1">
      <AkTypography tag="span">
        <AkMessageTranslate id="takeMeTo" />
      </AkTypography>

      <AkButton variant="text" color="primary" className="h-fit underline" noPadding asChild>
        <Link to="/login" data-test-back-to-login-link>
          <AkMessageTranslate id="login" />
        </Link>
      </AkButton>

      <AkTypography tag="span">
        <AkMessageTranslate id="page" />
      </AkTypography>
    </div>
  );
}
