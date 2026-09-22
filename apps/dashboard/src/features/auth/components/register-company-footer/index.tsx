import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

/** Points someone who already has an account at the login page. */
export function RegisterCompanyFooter() {
  return (
    <div className="flex items-center justify-center gap-1">
      <AkTypography tag="span">
        <AkMessageTranslate id="alreadyHaveAccount" />
      </AkTypography>

      <AkButton variant="text" color="primary" className="h-fit underline" noPadding asChild>
        <Link to="/login" data-test-login-link>
          <AkMessageTranslate id="login" />
        </Link>
      </AkButton>
    </div>
  );
}
