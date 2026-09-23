import { isWhitelabelEnabled } from '@irene/config';
import { APPKNOX_SUPPORT_EMAIL } from '@irene/constants';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkLink } from '@irene/ui/ak-link';
import { AkTypography } from '@irene/ui/ak-typography';
import NoResultIllustration from '@irene/ui/svgs/no-result.svg?react';

/**
 * Error state of the invitation pages, rendered when the link no longer names an
 * open invitation: `GET api/v2/registration-via-invite` answers 400
 * `{"token": ["Invalid Token"]}`, and `GET api/invite/<token>` answers 404.
 *
 * Carries no retry control: both are answered for a token that is malformed,
 * unknown, expired or already redeemed, none of which a refetch changes.
 *
 * The support address is a mailto link unless this is a whitelabel build, which
 * routes support elsewhere, so the word is rendered as plain text instead.
 */
export function RegisterInvitationInvalid() {
  const isWhitelabelled = isWhitelabelEnabled();

  return (
    <div className="flex flex-col items-center gap-6" data-test-invalid-invitation>
      <NoResultIllustration className="max-w-full" role="presentation" />

      <div className="flex flex-col items-center gap-2">
        <AkTypography tag="h1" variant="h2" fontWeight="bold" className="text-center text-xl">
          <AkMessageTranslate id="somethingWentWrong" />
        </AkTypography>

        <AkTypography color="textSecondary" className="text-center text-balance">
          <AkMessageTranslate id="invalidTokenError" />

          {isWhitelabelled ? (
            <span className="ml-1">
              <AkMessageTranslate id="supportLink" />
            </span>
          ) : (
            <AkLink
              href={`mailto:${APPKNOX_SUPPORT_EMAIL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1"
              data-test-contact-support-link
            >
              <AkMessageTranslate id="supportLink" />
            </AkLink>
          )}
        </AkTypography>
      </div>
    </div>
  );
}
