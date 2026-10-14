import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/layouts/dashboard-layout';

/* Everything under `/dashboard` renders inside the dashboard layout, except the landing page. */
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardLayout,
});
