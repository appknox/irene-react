import { useMutation, useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { APPKNOX_SUPPORT_EMAIL } from '@irene/constants';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * Shown when a route's guards or loaders fail: the page the user asked for
 * cannot be built. Every way out is offered, since a failure the user cannot
 * act on is the same as a page that never finishes loading — trying again,
 * asking for help, and leaving, for an account whose session is the problem.
 *
 * The status is shown so a report carries something to search for, and rides on
 * the support link's subject. That link is offered only on an Appknox host: a
 * whitelabel deployment routes support to its own vendor, whose address this
 * app does not hold. The failure itself is only printed while
 * developing: it is unlocalised, and a server's own wording says less to the
 * user than the hint above it.
 *
 * @param props.error - What went wrong.
 * @param props.reset - Clears the router's error, so the route can be tried again.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const { isAppknoxUrl } = useWhitelabel();
  const router = useRouter();
  const queryErrors = useQueryErrorResetBoundary();
  const logout = useLogout();

  const [isRetrying, setIsRetrying] = useState(false);
  const errorStatus = getApiErrorStatus(error);

  const supportEmailSubject = errorStatus
    ? `?subject=${encodeURIComponent(akMT('couldNotLoadPageStatus', { status: errorStatus }))}`
    : '';

  // The failed answers are cached, so they are dropped before the route reruns.
  const retry = useMutation({
    mutationFn: async () => {
      setIsRetrying(true);
      queryErrors.reset();
      reset();

      try {
        await router.invalidate();
      } finally {
        setIsRetrying(false);
      }
    },
  });

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center p-4"
      data-test-route-error
    >
      <div className="flex w-full max-w-120 flex-col items-center gap-4 rounded-sm border border-border bg-background p-10 text-center shadow-3">
        <AkIcon name="lucide:triangle-alert" className="size-10 text-error" />

        <AkTypography tag="h1" variant="h5">
          <AkMessageTranslate id="couldNotLoadPage" />
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          <AkMessageTranslate id="couldNotLoadPageHint" />
        </AkTypography>

        {errorStatus && (
          <AkTypography variant="body2" color="textSecondary" data-test-route-error-status>
            {akMT('couldNotLoadPageStatus', { status: errorStatus })}
          </AkTypography>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <AkButton loading={isRetrying} onClick={() => retry.mutate()} data-test-route-error-retry>
            {akMT('retry')}
          </AkButton>

          {isAppknoxUrl && (
            <AkButton color="neutral" asChild data-test-route-error-support>
              <a href={`mailto:${APPKNOX_SUPPORT_EMAIL}${supportEmailSubject}`}>
                {akMT('emailSupport')}
              </a>
            </AkButton>
          )}

          <AkButton
            variant="outlined"
            color="neutral"
            loading={logout.isPending}
            onClick={() => logout.mutate()}
            data-test-route-error-logout
          >
            <AkIcon name="material-symbols:logout" />

            {akMT('logout')}
          </AkButton>
        </div>

        {/* Stringified rather than read for a message: a loader may reject with anything. */}
        {import.meta.env.DEV && (
          <pre
            className="mt-4 max-w-full overflow-x-auto text-left text-xs text-muted-foreground"
            data-test-route-error-detail
          >
            {String(error)}
          </pre>
        )}
      </div>
    </main>
  );
}
