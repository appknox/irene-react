import { createFileRoute, redirect } from '@tanstack/react-router';

import { isPluginEnabled } from '@irene/config';
import { akMT } from '@irene/translations/intl';
import { MarketplacePage } from '@/features/marketplace/pages/marketplace';

export const Route = createFileRoute('/_authenticated/dashboard/marketplace')({
  staticData: { pageTitle: () => akMT('marketplace') },

  /* A deployment without the marketplace sends the URL home, as irene's route does. */
  beforeLoad: () => {
    if (!isPluginEnabled('IRENE_ENABLE_MARKETPLACE')) {
      throw redirect({ to: '/', replace: true });
    }
  },

  component: MarketplacePage,
});
