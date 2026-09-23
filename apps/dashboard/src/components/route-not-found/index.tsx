import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import NoResultIllustration from '@irene/ui/svgs/no-result.svg?react';

import { AppLogo } from '@/components/app-logo';

/**
 * Shown for a URL that matches no route, whether or not anyone is signed in.
 *
 * Built from the card the signed-out pages share rather than `AuthLayout`
 * itself, which carries a language switcher that belongs to the sign-in flow.
 *
 * The way out replaces this entry in history, so the back button does not
 * return to a URL that never resolved.
 */
export function RouteNotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      data-test-route-not-found
    >
      <div className="w-full max-w-md overflow-hidden rounded-sm border border-border bg-background shadow-3">
        <div className="flex justify-center px-6 pt-5 pb-3.5">
          <AppLogo className="max-h-11 max-w-42" />
        </div>

        <AkDivider />

        <div className="flex flex-col items-center gap-6 px-10 pt-6 pb-8">
          <NoResultIllustration className="max-w-full" role="presentation" />

          <div className="flex flex-col items-center gap-2">
            <AkTypography
              tag="h1"
              variant="h5"
              fontWeight="bold"
              align="center"
              className="text-lg"
            >
              <AkMessageTranslate id="pageNotFound" />
            </AkTypography>

            <AkTypography color="textSecondary" align="center" className="max-w-80">
              <AkMessageTranslate id="pageNotFoundHint" />
            </AkTypography>
          </div>

          <AkButton asChild data-test-route-not-found-home>
            <Link to="/" replace>
              <AkIcon name="material-symbols:home" />

              <AkMessageTranslate id="gotoHome" />
            </Link>
          </AkButton>
        </div>
      </div>
    </main>
  );
}
