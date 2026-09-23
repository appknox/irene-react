import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OidcAuthorizePage } from '@/features/auth/pages/oidc-authorize';

export const Route = createFileRoute('/_authenticated/dashboard/oidc/authorize')({
  staticData: { pageTitle: () => akMT('oidcModule.openIdConnectAuthorize') },
  validateSearch: z.object({ oidc_token: z.string() }),
  component: OidcAuthorizePage,
});
