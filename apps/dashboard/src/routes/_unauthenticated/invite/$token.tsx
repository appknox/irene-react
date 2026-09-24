import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationInvitePage } from '@/features/auth/pages/organization-invite';

export const Route = createFileRoute('/_unauthenticated/invite/$token')({
  staticData: { pageTitle: () => akMT('invitation') },
  component: OrganizationInvitePage,
});
