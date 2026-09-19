import { Outlet } from '@tanstack/react-router';
import { useSignedInElsewhere } from '@/features/auth/hooks/use-session-watch';

export function UnauthenticatedLayout() {
  /** Every signed-out page, watched so signing in on one tab lets the rest follow. */
  useSignedInElsewhere();

  return <Outlet />;
}
