import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OrganizationNamespacesPage } from '@/features/organization';

/*
  The list keeps where it is in the address, as irene keeps it in its route's
  query parameters. `catch` keeps a hand-edited address from erroring the
  screen.
*/
const searchSchema = z.object({
  namespace_limit: z.number().default(10).catch(10),
  namespace_offset: z.number().default(0).catch(0),
});

export const Route = createFileRoute('/_authenticated/dashboard/organization/namespaces')({
  staticData: { pageTitle: () => akMT('namespaces') },
  validateSearch: searchSchema,
  component: OrganizationNamespacesPage,
});
