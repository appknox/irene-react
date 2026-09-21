import { Outlet } from '@tanstack/react-router';
import { useRateLimitNotice } from '@/hooks/use-rate-limit-notice';

export function RootLayout() {
  /** Every page, signed in or out: a rate limit can start from any request. */
  useRateLimitNotice();

  return <Outlet />;
}
