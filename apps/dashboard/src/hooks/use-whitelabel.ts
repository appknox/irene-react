import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { configurationStore } from '@irene/api/stores/configuration';

/**
 * How this deployment presents itself, with the Appknox fallbacks applied.
 *
 * @returns The name, theme, logo, favicon and registration settings.
 */
export const useWhitelabel = () =>
  useStore(
    configurationStore,
    useShallow((configuration) => ({
      hidePoweredByLogo: configuration.frontendData.hide_poweredby_logo,
      url: configuration.frontendData.url,
      name: configuration.name(),
      theme: configuration.theme(),
      favicon: configuration.favicon(),
      logo: configuration.logo(),
      showRegistrationLink: configuration.showRegistrationLink(),
      registrationLink: configuration.registrationLink(),
      isAppknoxUrl: configuration.isAppknoxUrl(),
    }))
  );
