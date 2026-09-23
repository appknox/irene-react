import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { loadConfiguration, loadDashboardConfiguration } from '@/actions/load-configuration';
import { SystemStatusPage } from '@/features/status/pages/system-status';

/*
  Outside both guards: the page reports whether the systems are reachable, which
  is most worth reading when signing in is one of the things not working.
*/
export const Route = createFileRoute('/dashboard/status')({
  staticData: { pageTitle: () => akMT('status') },

  /*
    The device farm host comes from the configuration, so both answers are in
    before the checks run: the deployment's own, and the organization's when
    there is a session to read it with.
  */
  loader: async ({ context }) => {
    await loadConfiguration(context.queryClient); // Frontend and Server configurations
    await loadDashboardConfiguration(context.queryClient); // Dashboard configuration only
  },

  component: SystemStatusPage,
});
