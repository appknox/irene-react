import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the side navigation links here. */
export const Route = createFileRoute('/_authenticated/dashboard/sbom/apps')({
  staticData: { pageTitle: () => akMT('SBOM') },

  /*
  The offset is read from the URL and defaults here rather than at each link, so
  the navigation lands on the first page without asking for it. `catch` keeps a
  hand-edited URL from erroring the page.
*/
  validateSearch: z.object({ app_offset: z.number().default(0).catch(0) }),
  component: () => <RouteShell name={akMT('SBOM')} />,
});
