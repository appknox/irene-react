import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password';

export const Route = createFileRoute('/_unauthenticated/reset/$token')({
  component: ResetPasswordPage,
});
