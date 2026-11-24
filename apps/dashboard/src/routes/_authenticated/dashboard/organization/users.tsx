import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OrganizationUsersPage } from '@/features/organization';

/*
  The members and the invitations under them are two lists on one screen, so
  each keeps its own state in the address under its own names, as irene keeps
  them in its route's query parameters. `catch` keeps a hand-edited address
  from erroring the screen.
*/
const searchSchema = z.object({
  user_limit: z.number().default(10).catch(10),
  user_offset: z.number().default(0).catch(0),
  user_query: z.string().default('').catch(''),
  show_inactive_user: z.boolean().default(false).catch(false),
  invite_limit: z.number().default(10).catch(10),
  invite_offset: z.number().default(0).catch(0),
});

export const Route = createFileRoute('/_authenticated/dashboard/organization/users')({
  staticData: { pageTitle: () => akMT('users') },
  validateSearch: searchSchema,
  component: OrganizationUsersPage,
});
