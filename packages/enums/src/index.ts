import { extendEnums } from './extend';
import { AI_REPORTING_ENUMS } from './categories/ai-reporting';
import { DASHBOARD_ENUMS } from './categories/dashboard';
import { KNOXIQ_ENUMS } from './categories/knoxiq';
import { PRIVACY_ENUMS } from './categories/privacy';
import { STORE_RELEASE_ENUMS } from './categories/store-release';
import { STOREKNOX_ENUMS } from './categories/storeknox';

export { UNKNOWN, type Choice, type ExtendedEnums, type ExtendedGroup } from './extend';
export { ENUMS_DISPLAY } from './display';

/** Every enum irene defines. Read as ENUMS.RISK.CRITICAL or ENUMS.RISK.CHOICES. */
export const ENUMS = extendEnums({
  ...DASHBOARD_ENUMS,
  ...STOREKNOX_ENUMS,
  ...KNOXIQ_ENUMS,
  ...PRIVACY_ENUMS,
  ...STORE_RELEASE_ENUMS,
  ...AI_REPORTING_ENUMS,
});

export type Enums = typeof ENUMS;
