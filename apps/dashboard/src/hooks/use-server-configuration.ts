import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { configurationStore } from '@irene/api/stores/configuration';

/**
 * What the backend said about this install at boot.
 *
 * Read `isEnterprise` to decide whether a plan or upgrade prompt belongs on
 * screen: a self-hosted install is never sold anything.
 *
 * @returns Whether the install is self-hosted, and where its services live.
 */
export const useServerConfiguration = () =>
  useStore(
    configurationStore,
    useShallow((configuration) => ({
      isEnterprise: configuration.isEnterprise(),
      socketHost: configuration.socketHost(),
      deviceFarmUrl: configuration.deviceFarmUrl(),
    }))
  );
