import { Outlet } from '@tanstack/react-router';
import { useSessionWatch } from '@/features/auth/hooks/use-session-watch';

export function AuthenticatedLayout() {
  /** Every signed-in page, watched so a session cleared elsewhere signs this tab out too. */
  useSessionWatch();

  return <Outlet />;
}
