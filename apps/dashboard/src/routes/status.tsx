import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/status')({
  /* The address this page used to live at, kept working for anyone who saved it. */
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/status', replace: true });
  },
});
