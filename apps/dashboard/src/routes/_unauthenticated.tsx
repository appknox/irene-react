import { createFileRoute } from '@tanstack/react-router';
import { UnauthenticatedLayout } from '@/layouts/unauthenticated-layout';

export const Route = createFileRoute('/_unauthenticated')({
  component: UnauthenticatedLayout,
});
