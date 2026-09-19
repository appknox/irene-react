import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';
import { AuthLayout } from '@/layouts/auth-layout';

/**
 * Stands in while the identity provider's token is traded for a session. The
 * route ends in a redirect either way, so this is all the user ever sees of it.
 */
export function SsoRedirectPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <AkSpinner className="size-8 text-primary" />

        <AkTypography tag="h1" variant="h5">
          <AkMessageTranslate id="signingYouIn" />
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          <AkMessageTranslate id="completingSsoSignIn" />
        </AkTypography>
      </div>
    </AuthLayout>
  );
}
