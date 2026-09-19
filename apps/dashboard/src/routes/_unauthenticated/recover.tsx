import { createFileRoute } from '@tanstack/react-router';
import { RecoverPage } from '@/features/auth/pages/recover';

export const Route = createFileRoute('/_unauthenticated/recover')({
  component: RecoverPage,
});
