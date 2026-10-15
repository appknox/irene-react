import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the emails the signed-in account is sent when its scans finish. */
export const NotificationPreferenceEndpoints = {
  /** The account's email preferences (GET). */
  email: () => `${API_NAMESPACES.v2}/nf_email_notification_preference` as const,

  /** Sets one or more of the scan-result preferences (PUT). */
  updateVa: () =>
    `${API_NAMESPACES.v2}/nf_email_notification_preference/update_user_va_notification_pref` as const,
};
