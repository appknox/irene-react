import { DASHBOARD_ENUMS } from './categories/dashboard';

/** Display names irene renders for these enum values. */
export const ENUMS_DISPLAY = {
  PLATFORM: {
    [DASHBOARD_ENUMS.PLATFORM.ANDROID]: 'Android',
    [DASHBOARD_ENUMS.PLATFORM.IOS]: 'iOS',
    [DASHBOARD_ENUMS.PLATFORM.WINDOWS]: 'Windows',
    [DASHBOARD_ENUMS.PLATFORM.BLACKBERRY]: 'Blackberry',
    [DASHBOARD_ENUMS.PLATFORM.FIREFOX]: 'Firefox',
  },

  SBOM_COMPONENT_TYPE_NAMES: {
    [DASHBOARD_ENUMS.SBOM_COMPONENT_TYPE.FRAMEWORK]: 'framework',
    [DASHBOARD_ENUMS.SBOM_COMPONENT_TYPE.LIBRARY]: 'library',
    [DASHBOARD_ENUMS.SBOM_COMPONENT_TYPE.FILE]: 'file',
    [DASHBOARD_ENUMS.SBOM_COMPONENT_TYPE.MACHINE_LEARNING_MODEL]: 'machine-learning-model',
  },
} as const;
