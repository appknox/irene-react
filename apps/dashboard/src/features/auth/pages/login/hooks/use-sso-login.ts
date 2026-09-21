import { useMutation } from '@tanstack/react-query';

import { AuthService, type ApiSsoCheck } from '@irene/api/services/auth';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import { getSSOReturnUrl } from '@/features/auth/utils/sso';

/**
 * Hands the user over to their identity provider.
 *
 * The provider needs an absolute URL to return to, so the redirect is started
 * from the browser rather than followed server-side. Both the SSO-only step and
 * the SSO option beside the password use this.
 *
 * @param check - What the SSO check said about this account.
 * @returns Whether the redirect is being prepared, and how to start it.
 */
export function useSsoLogin(check: ApiSsoCheck) {
  const redirect = useMutation({
    mutationFn: (username: string) =>
      check.is_oidc
        ? AuthService.startOidc({ username, redirectUri: getSSOReturnUrl('oidc') })
        : AuthService.startSaml({ token: check.token, returnTo: getSSOReturnUrl('saml') }),

    onSuccess: ({ url: ssoUrl }) => {
      // A response without a URL leaves nowhere to send the user.
      if (!ssoUrl) {
        akNotify.error(akMT('pleaseTryAgain'));
      } else {
        window.location.href = ssoUrl;
      }
    },
    onError: unlessRateLimited(() => akNotify.error(akMT('pleaseTryAgain'))),
  });

  return {
    isPending: redirect.isPending,
    start: (username: string) => redirect.mutate(username),
  };
}
