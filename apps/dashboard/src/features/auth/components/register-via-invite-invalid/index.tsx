import { APPKNOX_SUPPORT_EMAIL } from '@irene/constants';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkLink } from '@irene/ui/ak-link';
import { AkTypography } from '@irene/ui/ak-typography';
import NoResultIllustration from '@irene/ui/svgs/no-result.svg?react';

import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * Error state of the invite registration page, rendered when
 * `GET api/v2/registration-via-invite` responds 400 `{"token": ["Invalid Token"]}`.
 *
 * Carries no retry control: the API returns that status for a token that is
 * unsigned, unknown, expired or already redeemed, none of which a refetch changes.
 *
 * The support address is a mailto link only on an Appknox-hosted deployment.
 * A whitelabelled one routes support elsewhere, so the word is rendered as text.
 */
export function RegisterViaInviteInvalid() {
  const { isAppknoxUrl } = useWhitelabel();

  return (
    <div className="flex flex-col items-center gap-6" data-test-invalid-invitation>
      <NoResultIllustration className="max-w-full" role="presentation" />

      <div className="flex flex-col items-center gap-2">
        <AkTypography tag="h1" variant="h2" fontWeight="bold" className="text-center text-xl">
          <AkMessageTranslate id="somethingWentWrong" />
        </AkTypography>

        <AkTypography color="textSecondary" className="text-center text-balance">
          <AkMessageTranslate id="invalidTokenError" />

          {isAppknoxUrl ? (
            <AkLink
              href={`mailto:${APPKNOX_SUPPORT_EMAIL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1"
              data-test-contact-support-link
            >
              <AkMessageTranslate id="supportLink" />
            </AkLink>
          ) : (
            <span className="ml-1">
              <AkMessageTranslate id="supportLink" />
            </span>
          )}
        </AkTypography>
      </div>
    </div>
  );
}
