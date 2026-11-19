import { z } from 'zod';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { DEFAULT_MESSAGES, type MessageId } from '@irene/translations/messages';

import type {
  ApiSkThirdPartyConfig,
  ApiSkThirdPartyRiskLabel,
  ApiSkThirdPartyStore,
} from '@irene/api/services/storeknox';

const STORES = ['appstore', 'playstore'] as const satisfies readonly ApiSkThirdPartyStore[];

/* The risk filters the list accepts: `-1` is irene's "every status". */
const RISK_STATUS_FILTERS: readonly number[] = [
  -1,
  ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL,
  ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM,
  ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH,
];

/** The third-party list's search params, under irene's names; garbage reads as unset. */
export const thirdPartyListSearchSchema = z.object({
  tp_limit: z.coerce.number().int().positive().optional().catch(undefined),
  tp_offset: z.coerce.number().int().nonnegative().optional().catch(undefined),
  tp_store: z.enum(STORES).optional().catch(undefined),
  tp_region: z.string().optional().catch(undefined),

  /* An empty value is unset: coercion alone would read `''` as 0, the minimal status. */
  tp_risk_status: z
    .preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce
        .number()
        .int()
        .refine((value) => RISK_STATUS_FILTERS.includes(value))
        .optional()
    )
    .catch(undefined),

  tp_filter: z.string().trim().min(1).optional().catch(undefined),
});

/** The search params the third-party list may carry, before defaults. */
export type ThirdPartyListSearch = z.infer<typeof thirdPartyListSearchSchema>;

/** The third-party app details' search params: which store, region and scanned version to show. */
export const thirdPartyDetailsSearchSchema = z.object({
  tp_store: z.enum(STORES).optional().catch(undefined),
  tp_region: z.string().optional().catch(undefined),
  tp_version: z.string().optional().catch(undefined),
});

/** The search params the third-party app details may carry, before defaults. */
export type ThirdPartyDetailsSearch = z.infer<typeof thirdPartyDetailsSearchSchema>;

/**
 * The regions each store is scanned in; a store with none, or no config yet, has an empty list.
 *
 * @param config - The organization's third-party scan config.
 */
export function regionsByStore(
  config: ApiSkThirdPartyConfig | null | undefined
): Record<ApiSkThirdPartyStore, string[]> {
  return {
    appstore: config?.appstore_regions_opted ?? [],
    playstore: config?.playstore_regions_opted ?? [],
  };
}

/**
 * The stores with at least one opted region, App Store first.
 *
 * @param config - The organization's third-party scan config.
 */
export function availableStores(
  config: ApiSkThirdPartyConfig | null | undefined
): ApiSkThirdPartyStore[] {
  const regions = regionsByStore(config);

  return STORES.filter((store) => regions[store].length > 0);
}

/**
 * Whether any store has a region to list apps for; without one the list is empty and sends no request.
 *
 * @param config - The organization's third-party scan config.
 */
export const hasThirdPartyScope = (config: ApiSkThirdPartyConfig | null | undefined): boolean =>
  availableStores(config).length > 0;

/**
 * The store and region to show: the asked store when it has regions, else the first store with
 * regions, else Play Store (irene's fallback); the asked region when that store opted into it, else
 * the store's first region, else none.
 *
 * @param config - The organization's third-party scan config.
 * @param asked - The store and region the URL carries.
 */
export function resolveThirdPartyScope(
  config: ApiSkThirdPartyConfig | null | undefined,
  asked: { store?: ApiSkThirdPartyStore; region?: string }
): { store: ApiSkThirdPartyStore; region: string } {
  const stores = availableStores(config);
  const regions = regionsByStore(config);

  const store =
    asked.store && stores.includes(asked.store) ? asked.store : (stores[0] ?? 'playstore');

  const opted = regions[store];
  const region = asked.region && opted.includes(asked.region) ? asked.region : (opted[0] ?? '');

  return { store, region };
}

/**
 * The list filter's word for an app's risk status code, or null for a code the enum does not name.
 *
 * @param status - The `risk_status` the server sent.
 */
export function riskStatusLabel(status: number): ApiSkThirdPartyRiskLabel | null {
  switch (status) {
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL:
      return 'minimal';
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM:
      return 'medium';
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH:
      return 'high';
    default:
      return null;
  }
}

type RegionNameId = Extract<MessageId, `storeknox.regionNames.${string}`>;

const _isRegionNameId = (id: string): id is RegionNameId =>
  id.startsWith('storeknox.regionNames.') && Object.hasOwn(DEFAULT_MESSAGES, id);

/**
 * A region's name when `storeknox.regionNames.<CODE>` exists, else the code as it is.
 *
 * @param code - The region code the config carries.
 */
export function regionLabel(code: string): string {
  const id = `storeknox.regionNames.${code}`;

  return _isRegionNameId(id) ? akMT(id) : code;
}
