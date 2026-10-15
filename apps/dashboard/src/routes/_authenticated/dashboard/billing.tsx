import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { BillingPage } from '@/features/billing/pages/billing';

export const Route = createFileRoute('/_authenticated/dashboard/billing')({
  staticData: { pageTitle: () => akMT('billing') },
  component: BillingPage,
});
