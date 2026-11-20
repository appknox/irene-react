import { createFileRoute } from '@tanstack/react-router';
import { UnscannedVersionTablePage } from '@/features/storeknox/pages/unscanned-version';

export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory-details/$id/unscanned-version/'
)({
  component: () => <UnscannedVersionTablePage />,
});
