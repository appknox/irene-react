import { Outlet } from '@tanstack/react-router';

import { useInventoryApp } from '@/features/storeknox/hooks/use-inventory-app';

import { UnscannedVersionHeader } from './components/unscanned-version-header';
import { VersionsTable } from './components/versions-table';

/** The unscanned-versions section: its tabs and overview, above whichever table is open. */
export function UnscannedVersionLayout() {
  const app = useInventoryApp();

  return (
    <div className="flex w-full flex-col" data-test-sk-unscanned-version>
      <UnscannedVersionHeader app={app} />

      <Outlet />
    </div>
  );
}

/** One of the section's tables: the versions on the store now, or every version seen when `isHistory`. */
export function UnscannedVersionTablePage({
  isHistory = false,
}: Readonly<{ isHistory?: boolean }>) {
  const app = useInventoryApp();

  return <VersionsTable app={app} isHistory={isHistory} />;
}
