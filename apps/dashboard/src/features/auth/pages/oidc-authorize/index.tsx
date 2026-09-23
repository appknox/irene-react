import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useEffect } from 'react';

import { OidcService, type ApiOidcValidationResult } from '@irene/api/services/oidc';
import { getApiErrorPayload } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { OidcError } from '@/features/auth/components/oidc-error';
import { AuthLayout } from '@/layouts/auth-layout';
import { oidcAuthorizationOptions } from '@/queries/oidc';

const oidcAuthorizeRoute = getRouteApi('/_authenticated/dashboard/oidc/authorize');

// Error response type for the OIDC authorization request.
type ApiOidcValidationError = { validation_result?: ApiOidcValidationResult };

/**
 * Asks the account to grant an OIDC client the scopes it requested.
 *
 * Both answers end at the client: `POST api/v2/oidc/authorization/authorize`
 * returns 200 with a `redirect_url` carrying a code when the account allows it,
 * and 400 with a `redirect_url` carrying `error=access_denied` when it refuses.
 * A client the account has already granted these scopes to — or one marked
 * trusted — comes back with `authorization_needed: false`, and is granted
 * without anything being shown.
 */
export function OidcAuthorizePage() {
  const { oidc_token: token } = oidcAuthorizeRoute.useSearch();
  const authorization = useQuery(oidcAuthorizationOptions(token));
  const authorizationFormData = authorization.data?.form_data;

  // Mutation to decide on the authorization request.
  const decideMutation = useMutation({
    mutationFn: (allow: boolean) => OidcService.authorize({ token, allow }),

    onSuccess: (result) => {
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    },

    /* A refusal is answered 400, and carries the client's callback of its own. */
    onError: (error) => {
      const refusal = getApiErrorPayload<ApiOidcValidationResult>(error);

      if (refusal?.redirect_url) {
        window.location.href = refusal.redirect_url;
      } else {
        akNotify.error(refusal?.error?.description || akMT('somethingWentWrong'));
      }
    },
  });

  const { mutate: decideOnClient } = decideMutation;
  const alreadyGranted = authorizationFormData?.authorization_needed === false;
  const readingRequest = authorization.isPending || alreadyGranted;
  const requestRefused = getApiErrorPayload<ApiOidcValidationError>(authorization.error);

  // Effect to grant a client that needs no asking, which is the API's own answer.
  useEffect(() => {
    if (alreadyGranted) {
      decideOnClient(true);
    }
  }, [alreadyGranted, decideOnClient]);

  // If the authorization request failed, show the error.
  if (authorization.isError) {
    return (
      <AuthLayout>
        <OidcError description={requestRefused?.validation_result?.error?.description} />
      </AuthLayout>
    );
  }

  // If the authorization request is still being processed, show the loading spinner.
  if (readingRequest || !authorizationFormData) {
    return (
      <AuthLayout>
        <div
          className="flex flex-col items-center gap-3"
          aria-busy
          data-test-oidc-authorize-pending
        >
          <AkSpinner className="size-6 text-primary" aria-hidden />

          <AkTypography color="textSecondary">{akMT('loading')}</AkTypography>
        </div>
      </AuthLayout>
    );
  }

  // If the authorization request is successful, show the authorization form.
  return (
    <AuthLayout noPadding>
      <div className="px-10 pt-6 pb-10">
        <AkTypography tag="h1" fontWeight="bold" variant="h4" className="mb-5 text-xl">
          {akMT('oidcModule.permissionHeading', {
            applicationName: authorizationFormData.application_name,
          })}
        </AkTypography>

        <ul className="flex flex-col gap-2" data-test-oidc-scopes>
          {authorizationFormData.scopes_descriptions.map((scope) => (
            <li key={scope} className="flex items-center gap-2">
              <AkIcon name="material-symbols:done" className="size-4 text-success" />

              <AkTypography tag="span">{scope}</AkTypography>
            </li>
          ))}
        </ul>
      </div>

      <AkDivider />

      <div className="px-10 py-6 flex items-center gap-3">
        <AkButton
          variant="outlined"
          color="neutral"
          className="flex-1"
          disabled={decideMutation.isPending}
          onClick={() => decideMutation.mutate(false)}
          data-test-oidc-cancel-button
        >
          <AkMessageTranslate id="cancel" />
        </AkButton>

        <AkButton
          className="flex-1"
          loading={decideMutation.isPending}
          onClick={() => decideMutation.mutate(true)}
          data-test-oidc-authorize-button
        >
          <AkMessageTranslate id="authorize" />
        </AkButton>
      </div>
    </AuthLayout>
  );
}
