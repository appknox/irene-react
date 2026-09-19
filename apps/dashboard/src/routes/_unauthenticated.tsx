import { createFileRoute } from '@tanstack/react-router';
import { UnauthenticatedLayout } from '@/layouts/unauthenticated-layout';

/*
  No guard here on purpose. A signed-in user still has business on these pages:
  resetting a password they know from an emailed link, or coming back from an
  identity provider. Only the login page turns them away — see its own route.
*/
export const Route = createFileRoute('/_unauthenticated')({
  component: UnauthenticatedLayout,
});
