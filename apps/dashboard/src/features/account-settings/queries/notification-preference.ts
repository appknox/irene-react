import { queryOptions } from '@tanstack/react-query';
import { NotificationPreferenceService } from '@irene/api/services/notification-preference';

/** The cache keys for which scan results the account is emailed about. */
export const notificationPreferenceKeys = {
  all: () => ['notification-preference'] as const,
  va: () => [...notificationPreferenceKeys.all(), 'va'] as const,
};

/**
 * Builds the query for the account's scan-result email preferences.
 *
 * @returns Query options resolving to the four preferences.
 */
export const vaNotificationPreferenceOptions = () =>
  queryOptions({
    queryKey: notificationPreferenceKeys.va(),
    queryFn: NotificationPreferenceService.getVaPreference,
  });
