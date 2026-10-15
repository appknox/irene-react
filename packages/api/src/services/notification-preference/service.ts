import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';

import type {
  ApiVaNotificationPreference,
  ApiVaNotificationPreferenceKey,
} from '@irene/api/services/notification-preference';

import { NotificationPreferenceEndpoints } from './endpoints';

/**
 * Keeps the four scan-result preferences, dropping the role-only ones the
 * list also carries for an owner or admin.
 *
 * @param preferences - The body either endpoint answers with.
 * @returns The four preferences.
 */
const _toVaPreference = (
  preferences: ApiVaNotificationPreference
): ApiVaNotificationPreference => ({
  all_va_completed: preferences.all_va_completed,
  static_scan_completed: preferences.static_scan_completed,
  dynamic_scan_completed: preferences.dynamic_scan_completed,
  api_scan_completed: preferences.api_scan_completed,
});

/** Talks to the endpoints holding which scan results the account is emailed about. */
export default class NotificationPreferenceService {
  /**
   * Fetches the account's scan-result email preferences.
   *
   * @returns The four preferences.
   */
  public static readonly getVaPreference = async () => {
    const preferences = await apiRequest.get<ApiVaNotificationPreference>(
      NotificationPreferenceEndpoints.email(),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return _toVaPreference(preferences);
  };

  /**
   * Turns one preference on or off.
   *
   * @param key - The preference.
   * @param value - Whether it is on.
   * @returns All four as the server now holds them, which turning `all_va_completed`
   * on changes beyond the one that was sent.
   */
  public static readonly updateVaPreference = async (
    key: ApiVaNotificationPreferenceKey,
    value: boolean
  ) => {
    const preferences = await apiRequest.put<ApiVaNotificationPreference>(
      NotificationPreferenceEndpoints.updateVa(),
      { [key]: value }
    );

    return _toVaPreference(preferences);
  };
}
