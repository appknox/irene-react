import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { getApiErrorPayload } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOidcValidationResult } from '@irene/api/services/oidc';

import { OidcError } from '@/features/auth/components/oidc-error';
import { AuthLayout } from '@/layouts/auth-layout';
import { oidcTokenValidationOptions } from '@/queries/oidc';

const oidcRedirectRoute = getRouteApi('/_authenticated/dashboard/oidc/redirect');

/**
 * Where an OIDC client's redirect lands.
 *
 * Checks the token with `POST api/v2/oidc/authorization/validate`, then sends
 * the browser on: to the consent screen when it passes, to the client's own
 * callback when the API answers a refusal with a `redirect_url`, and to the
 * error state when it answers one without.
 */
export function OidcRedirectPage() {
  const { oidc_token: token } = oidcRedirectRoute.useSearch();
  const navigate = useNavigate();

  const validation = useQuery(oidcTokenValidationOptions(token));

  const refusal = getApiErrorPayload<ApiOidcValidationResult>(validation.error);
  const clientCallback = refusal?.redirect_url;

  // Effect to follow the API's answer, which is a URL outside this app or a route inside it.
  useEffect(() => {
    if (validation.data?.valid) {
      navigate({ to: '/dashboard/oidc/authorize', search: { oidc_token: token } });

      return;
    }

    if (clientCallback) {
      window.location.href = clientCallback;
    }
  }, [validation.data, clientCallback, navigate, token]);

  if (validation.isError && !clientCallback) {
    return (
      <AuthLayout>
        <OidcError description={refusal?.error?.description} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-3" aria-busy data-test-oidc-redirect-pending>
        <AkSpinner className="size-6 text-primary" aria-hidden />

        <AkTypography color="textSecondary">{akMT('loading')}</AkTypography>
      </div>
    </AuthLayout>
  );
}
