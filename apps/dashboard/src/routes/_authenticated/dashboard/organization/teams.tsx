import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OrganizationTeamsPage } from '@/features/organization';

/*
  The list keeps where it is and what it is searching in the address, as irene
  keeps them in its route's query parameters, so a link can open the screen
  already searched for one team. `catch` keeps a hand-edited address from
  erroring the screen.
*/
const searchSchema = z.object({
  team_limit: z.number().default(10).catch(10),
  team_offset: z.number().default(0).catch(0),
  team_query: z.string().default('').catch(''),
});

export const Route = createFileRoute('/_authenticated/dashboard/organization/teams')({
  staticData: { pageTitle: () => akMT('teams') },
  validateSearch: searchSchema,
  component: OrganizationTeamsPage,
});
