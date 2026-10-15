/**
 * Which scan results the account is emailed a summary of. Every role has these
 * four; owners and admins are sent further preferences this type leaves out.
 *
 * `all_va_completed` sends one email once every scan on a file is done, and
 * the server turns the three per-scan preferences off when it is turned on.
 */
export interface ApiVaNotificationPreference {
  all_va_completed: boolean;
  static_scan_completed: boolean;
  dynamic_scan_completed: boolean;
  api_scan_completed: boolean;
}

/** One of the four scan-result preferences. */
export type ApiVaNotificationPreferenceKey = keyof ApiVaNotificationPreference;
