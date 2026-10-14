import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the SBOM notifications link here. */
export const Route = createFileRoute('/_authenticated/dashboard/sbom/component-inventory')({
  validateSearch: z.object({ component_query: z.string().optional() }),
  staticData: { pageTitle: () => akMT('SBOM') },
  component: () => <RouteShell name={akMT('SBOM')} />,
});
