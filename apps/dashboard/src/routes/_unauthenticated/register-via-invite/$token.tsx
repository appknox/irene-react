import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RegisterViaInvitePage } from '@/features/auth/pages/register-via-invite';

export const Route = createFileRoute('/_unauthenticated/register-via-invite/$token')({
  staticData: { pageTitle: () => akMT('register') },
  component: RegisterViaInvitePage,
});
