import type { ApiSkFakeApp, ApiSkFakeAppCounts } from '@irene/api/services/storeknox';
import { ENUMS } from '@irene/enums';

/**
 * Whether a copy has been reviewed away; irene reads `reviewedBy`, which the server
 * sets for both ignoring and adding to the inventory, so both statuses count.
 */
export function isFakeAppIgnored(app: Pick<ApiSkFakeApp, 'status'>) {
  return (
    app.status === ENUMS.SK_FAKE_APP_STATUS.IGNORED ||
    app.status === ENUMS.SK_FAKE_APP_STATUS.ADDED_TO_INVENTORY
  );
}

/** Whether a reviewer added the copy to the inventory as the app it points to. */
export function isFakeAppAddedToInventory(app: Pick<ApiSkFakeApp, 'status'>) {
  return app.status === ENUMS.SK_FAKE_APP_STATUS.ADDED_TO_INVENTORY;
}

/** Whether the copy may be added to the inventory; apkmody and aptoide listings cannot be monitored. */
export function canAddFakeAppToInventory(app: Pick<ApiSkFakeApp, 'store'>) {
  return app.store.identifier !== 'apkmody' && app.store.identifier !== 'aptoide';
}

/**
 * The AI's confidence as a rounded percentage, as irene's `Math.round(final * 100)`;
 * `null` when the server sent no numeric `final` score.
 */
export function fakeAppConfidence(app: Pick<ApiSkFakeApp, 'ai_scores'>) {
  const final = app.ai_scores.final;

  return typeof final === 'number' && Number.isFinite(final) ? Math.round(final * 100) : null;
}

/** The copies still waiting for review: brand abuse plus fake apps, which leaves the ignored ones out. */
export function suspectedTotal(counts: ApiSkFakeAppCounts | null) {
  return counts ? counts.brand_abuse + counts.fake_app : 0;
}

/** A part as a percentage of the total; irene divides unguarded and shows NaN for no suspected apps, this gives 0. */
export function suspectedShare(part: number, total: number) {
  return total === 0 ? 0 : (part / total) * 100;
}

/** Whether detection has found anything at all, ignored copies included. */
export function hasSuspectedApps(counts: ApiSkFakeAppCounts | null) {
  return counts !== null && counts.brand_abuse + counts.fake_app + counts.ignored > 0;
}
