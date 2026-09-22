import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RegisterPageWithRecaptcha } from '@/features/auth/pages/register';
import { frontendConfigurationOptions } from '@/queries/configuration';

/** A registration link to somewhere else entirely, rather than a path in this app. */
const EXTERNAL_LINK = /^https?:\/\//i;

export const Route = createFileRoute('/_unauthenticated/register')({
  staticData: { pageTitle: () => akMT('register') },

  /*
    A deployment that signs people up elsewhere sends them there instead.

    The configuration is queried rather than read from the store: the root
    starts that request without waiting for it, so on a cold load of this page
    the store is still empty and the link would read as blank.
  */
  beforeLoad: async ({ context }) => {
    const frontendConfiguration = await context.queryClient.query(frontendConfigurationOptions());

    if (EXTERNAL_LINK.test(frontendConfiguration.registration_link)) {
      window.location.href = frontendConfiguration.registration_link;
    }
  },

  component: RegisterPageWithRecaptcha,
});
