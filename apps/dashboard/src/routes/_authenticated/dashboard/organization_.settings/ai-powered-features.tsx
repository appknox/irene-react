import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationAiPoweredFeaturesPage } from '@/features/organization';

/* One tab of the organization's settings, which the wrapper draws around it. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/organization_/settings/ai-powered-features'
)({
  staticData: { pageTitle: () => akMT('aiPoweredFeatures') },
  component: OrganizationAiPoweredFeaturesPage,
});
