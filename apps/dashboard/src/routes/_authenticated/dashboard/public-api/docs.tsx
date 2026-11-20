import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { PublicApiDocsPage } from '@/features/public-api';
import { DocsSkeleton } from '@/features/public-api/pages/docs/components/docs-skeleton';

export const Route = createFileRoute('/_authenticated/dashboard/public-api/docs')({
  staticData: { pageTitle: () => akMT('apiDocumentation') },
  component: PublicApiDocsPage,
  pendingComponent: DocsSkeleton,
});
