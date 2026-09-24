import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import NoResultIllustration from '@irene/ui/svgs/no-result.svg?react';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { sessionCheckOptions } from '@/features/auth/queries/session';

/**
 * Error state of the OIDC screens, rendered when the API refuses the
 * `oidc_token` and answers with no `redirect_url` to send the browser to.
 *
 * Offers no retry: the token is single use and cached for 300s, so the client
 * has to start the flow again. What is offered instead depends on the session,
 * since `/login` sends a signed-in user straight back to `/`.
 *
 * Every way out replaces this page in history rather than stacking on it: the
 * URL holds a spent `oidc_token`, so returning to it only repeats the refusal.
 *
 * @param props.description - The API's own wording for the refusal, which is empty for some codes.
 */
export function OidcError({ description }: Readonly<{ description?: string }>) {
  const { data: session } = useQuery(sessionCheckOptions());
  const logout = useLogout({ replaceRoute: true });

  return (
    <div className="flex flex-col items-center gap-8" data-test-oidc-error>
      <NoResultIllustration className="max-w-full " role="presentation" />

      <div className="flex flex-col items-center gap-2">
        <AkTypography
          tag="h1"
          fontWeight="bold"
          variant="h4"
          align="center"
          className="max-w-80 text-xl"
        >
          {description || akMT('somethingWentWrong')}
        </AkTypography>

        <AkTypography color="textSecondary" align="center" className="max-w-70">
          {session
            ? akMT('oidcModule.errorHelperTextSignedIn')
            : akMT('oidcModule.errorHelperTextSignedOut')}
        </AkTypography>
      </div>

      <div className="flex items-center justify-center gap-3">
        {session ? (
          <Fragment>
            <AkButton asChild data-test-oidc-error-dashboard>
              <Link to="/" replace>
                <AkIcon name="material-symbols:home" /> {akMT('dashboardHome')}
              </Link>
            </AkButton>

            <AkButton
              variant="outlined"
              color="neutral"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
              data-test-oidc-error-relogin
            >
              <AkIcon name="material-symbols:login" /> {akMT('loginAgain')}
            </AkButton>
          </Fragment>
        ) : (
          <AkButton asChild data-test-oidc-error-login>
            <Link to="/login" replace>
              <AkIcon name="material-symbols:login" /> {akMT('login')}
            </Link>
          </AkButton>
        )}
      </div>
    </div>
  );
}
