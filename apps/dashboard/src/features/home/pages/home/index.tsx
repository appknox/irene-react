import { AkButton } from '@irene/ui/ak-button';
import { useLogout } from '@/features/auth/hooks/use-logout';

export function HomePage() {
  const logout = useLogout();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AkButton loading={logout.isPending} onClick={() => logout.mutate()} data-test-logout-button>
        Logout
      </AkButton>
    </main>
  );
}
