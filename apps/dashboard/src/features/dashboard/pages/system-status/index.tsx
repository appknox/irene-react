import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  apiStatusOptions,
  deviceFarmStatusOptions,
  storageStatusOptions,
} from '@/queries/system-status';

import { AppLogo } from '@/components/app-logo';
import { LanguageSwitcher } from '@/features/auth/components/language-switcher';
import { useServerConfiguration } from '@/hooks/use-server-configuration';

import { SystemStatusCell } from './status-cell';

/** One system the page reports on, and what its check last answered. */
interface SystemStatus {
  id: string;
  system: string;
  isChecking: boolean;
  isWorking: boolean;
  hint?: string;
}

// Table columns
const statusColumn = createAkTableColumns<SystemStatus>();

const STATUS_COLUMNS = statusColumn.columns([
  statusColumn.accessor('system', {
    header: () => akMT('system'),
    meta: { width: '45%' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" title={getValue()} noWrap>
        {getValue()}
      </AkTypography>
    ),
  }),

  statusColumn.display({
    id: 'status',
    header: () => akMT('status'),

    /* The wider half: an unreachable system carries a hint under its wording. */
    meta: { width: '55%' },
    cell: ({ row }) => <SystemStatusCell {...row.original} />,
  }),
]);

/**
 * Reports whether each system this deployment depends on is reachable.
 *
 * Every check runs on its own, so a system that is down leaves the others
 * answering rather than holding the page. None is retried: a system being down
 * is what the page is for.
 */
export function SystemStatusPage() {
  const { deviceFarmUrl } = useServerConfiguration();
  const storage = useQuery(storageStatusOptions());
  const api = useQuery(apiStatusOptions());
  const deviceFarm = useQuery(deviceFarmStatusOptions(deviceFarmUrl));

  const systemsStatusData = useMemo<SystemStatus[]>(
    () => [
      {
        id: 'storage',
        system: akMT('storage'),
        isChecking: storage.isPending || storage.isFetching,
        isWorking: storage.data === true,
        hint: akMT('proxyWarning'),
      },
      {
        id: 'devicefarm',
        system: akMT('devicefarm'),
        isChecking: deviceFarm.isPending || deviceFarm.isFetching,
        isWorking: deviceFarm.data === true,
      },
      {
        id: 'api-server',
        system: `${akMT('api')} ${akMT('server')}`,
        isChecking: api.isPending || api.isFetching,
        isWorking: api.data === true,
      },
    ],
    [
      api.data,
      api.isFetching,
      api.isPending,
      deviceFarm.data,
      deviceFarm.isFetching,
      deviceFarm.isPending,
      storage.data,
      storage.isFetching,
      storage.isPending,
    ]
  );

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      data-test-system-status
    >
      <div className="w-full max-w-lg overflow-hidden rounded-sm border border-border bg-background shadow-3">
        <div className="flex justify-center px-6 pt-5 pb-3.5">
          <AppLogo className="max-h-11 max-w-42" />
        </div>

        <AkDivider />

        <div className="flex flex-col gap-4 p-6">
          <AkTypography
            tag="h1"
            variant="h5"
            fontWeight="bold"
            align="center"
            data-test-system-status-title
          >
            <AkMessageTranslate id="systemStatus" />
          </AkTypography>

          <AkTable
            columns={STATUS_COLUMNS}
            data={systemsStatusData}
            borderColor="dark"
            caption={akMT('systemStatus')}
            getRowId={(system) => system.id}
          />
        </div>
      </div>

      <div className="flex flex-col items-center mt-8">
        <LanguageSwitcher />
      </div>
    </main>
  );
}
