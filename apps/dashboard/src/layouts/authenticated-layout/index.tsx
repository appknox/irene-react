import { Outlet } from '@tanstack/react-router';

import { useSessionWatch } from '@/features/auth/hooks/use-session-watch';
import { useDashboardWebsocket } from '@/hooks/use-dashboard-websocket';

export function AuthenticatedLayout() {
  /** Every signed-in page, watched so a session cleared elsewhere signs this tab out too. */
  useSessionWatch();

  /** One connection to the account's room, which every product's events arrive on. */
  useDashboardWebsocket();

  return <Outlet />;
}
