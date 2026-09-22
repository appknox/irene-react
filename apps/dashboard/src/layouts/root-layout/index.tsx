import { Outlet } from '@tanstack/react-router';
import { Fragment } from 'react';

import { DocumentHead } from '@/components/document-head';
import { RouteTransitionIndicator } from '@/components/route-transition-indicator';
import { useRateLimitNotice } from '@/hooks/use-rate-limit-notice';
import { useThemeClass } from '@/hooks/use-theme-class';

export function RootLayout() {
  /** The color scheme a deployment resolves to. */
  useThemeClass();

  /** Every page, signed in or out: a throttle can start from any request. */
  useRateLimitNotice();

  return (
    <Fragment>
      <DocumentHead />

      {/* Every page, signed in or out: a page can be navigated to or fetch from either side. */}
      <RouteTransitionIndicator />

      <Outlet />
    </Fragment>
  );
}
