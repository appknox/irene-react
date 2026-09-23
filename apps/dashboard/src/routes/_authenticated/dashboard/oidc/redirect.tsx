import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OidcRedirectPage } from '@/features/auth/pages/oidc-redirect';

export const Route = createFileRoute('/_authenticated/dashboard/oidc/redirect')({
  staticData: { pageTitle: () => akMT('oidcModule.openIdConnectAuthorize') },
  validateSearch: z.object({ oidc_token: z.string() }),
  component: OidcRedirectPage,
});
