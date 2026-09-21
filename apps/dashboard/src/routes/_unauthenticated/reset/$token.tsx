import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password';

export const Route = createFileRoute('/_unauthenticated/reset/$token')({
  staticData: { pageTitle: () => akMT('resetPassword') },
  component: ResetPasswordPage,
});
