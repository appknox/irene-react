import { createFileRoute, redirect } from '@tanstack/react-router';

/* The security dashboard has no landing page: it opens on the projects it assesses. */
export const Route = createFileRoute('/_authenticated/security/')({
  beforeLoad: () => {
    throw redirect({ to: '/security/projects', replace: true });
  },
});
