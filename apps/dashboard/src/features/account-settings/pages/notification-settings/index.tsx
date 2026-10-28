import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect } from 'react';

import {
  NotificationPreferenceService,
  type ApiVaNotificationPreference,
  type ApiVaNotificationPreferenceKey,
} from '@irene/api/services/notification-preference';

import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  notificationPreferenceKeys,
  vaNotificationPreferenceOptions,
} from '@/features/account-settings/queries/notification-preference';

import { SettingsItem } from './components/settings-item';

/** Every preference off: what irene shows until the account's arrive, and if they never do. */
const NO_PREFERENCES: ApiVaNotificationPreference = {
  all_va_completed: false,
  static_scan_completed: false,
  dynamic_scan_completed: false,
  api_scan_completed: false,
};

interface SettingDefinition {
  id: ApiVaNotificationPreferenceKey;
  title: () => string;
  description: () => string;
}

interface GroupDefinition {
  id: string;
  title: () => string;
  tooltip: () => string;
  /** Whether the VA notification overrides this group while it is on. */
  isOverriddenByVa: boolean;
  settings: SettingDefinition[];
}

/* The VA notification, then the three it overrides, as irene groups them. */
const GROUPS: GroupDefinition[] = [
  {
    id: 'va_notification',
    title: () => akMT('accountNotifSettings.vaNotificationTitle'),
    tooltip: () => akMT('accountNotifSettings.vaNotificationTooltip'),
    isOverriddenByVa: false,
    settings: [
      {
        id: 'all_va_completed',
        title: () => akMT('accountNotifSettings.vaNotificationTitle'),
        description: () => akMT('accountNotifSettings.vaNotificationDescription'),
      },
    ],
  },
  {
    id: 'individual_scan_level_notification',
    title: () => akMT('accountNotifSettings.individualScanTitle'),
    tooltip: () => akMT('accountNotifSettings.individualScanTooltip'),
    isOverriddenByVa: true,
    settings: [
      {
        id: 'static_scan_completed',
        title: () => akMT('accountNotifSettings.staticScanTitle'),
        description: () => akMT('accountNotifSettings.staticScanDescription'),
      },
      {
        id: 'dynamic_scan_completed',
        title: () => akMT('accountNotifSettings.dynamicScanTitle'),
        description: () => akMT('accountNotifSettings.dynamicScanDescription'),
      },
      {
        id: 'api_scan_completed',
        title: () => akMT('accountNotifSettings.apiScanTitle'),
        description: () => akMT('accountNotifSettings.apiScanDescription'),
      },
    ],
  },
];

/**
 * The notification preferences tab of account settings: which scan results
 * the account is emailed a summary of.
 *
 * Each toggle takes effect as it is flipped. It moves at once and moves back
 * if the server refuses, as irene's does, and the server's answer replaces all
 * four, since turning the VA notification on turns the other three off.
 */
export function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const preferences = useQuery(vaNotificationPreferenceOptions());
  const current = preferences.data ?? NO_PREFERENCES;

  useEffect(() => {
    if (preferences.isError) {
      akNotify.error(akMT('accountNotifSettings.errorFetchingPreferences'));
    }
  }, [preferences.isError]);

  const updatePreference = useMutation({
    mutationFn: ({ key, value }: { key: ApiVaNotificationPreferenceKey; value: boolean }) =>
      NotificationPreferenceService.updateVaPreference(key, value),

    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: notificationPreferenceKeys.va() });
      queryClient.setQueryData(notificationPreferenceKeys.va(), { ...current, [key]: value });

      return { previous: current };
    },

    onSuccess: (updated) => {
      queryClient.setQueryData(notificationPreferenceKeys.va(), updated);
      akNotify.success(akMT('accountNotifSettings.notificationPreferenceUpdated'));
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationPreferenceKeys.va(), context?.previous);
      akNotify.error(akMT('accountNotifSettings.notificationPreferenceUpdateFailed'));
    },
  });

  /* irene holds a toggle while its own request runs; the pending key says which one. */
  const pendingKey = updatePreference.isPending ? updatePreference.variables.key : null;

  return (
    <section className="flex w-full flex-col gap-5.25 p-5.25" data-test-notification-settings>
      <AkTypography variant="h5">{akMT('accountNotifSettings.emailSummaryTitle')}</AkTypography>

      {GROUPS.map((group) => (
        <div
          key={group.id}
          className="flex flex-col gap-2.5"
          data-test-notification-group={group.id}
        >
          <div className="flex items-center gap-1">
            <AkTypography variant="subtitle1">{group.title()}</AkTypography>

            <AkTooltip
              title={group.tooltip()}
              arrow
              side="right"
              className="max-w-85 whitespace-normal"
            >
              <button
                type="button"
                aria-label={group.tooltip()}
                className="inline-flex cursor-help text-foreground-muted"
              >
                <AkIcon name="material-symbols:info" className="size-4" />
              </button>
            </AkTooltip>
          </div>

          <div className="flex flex-col gap-3.5 rounded-sm border border-border px-4 py-4.5">
            {group.settings.map((setting, index) => (
              <Fragment key={setting.id}>
                {index > 0 && <AkDivider color="dark" />}

                <SettingsItem
                  title={setting.title()}
                  description={setting.description()}
                  isEnabled={current[setting.id]}
                  isLocked={group.isOverriddenByVa && current.all_va_completed}
                  isLoading={preferences.isPending || pendingKey === setting.id}
                  onToggle={(value) => updatePreference.mutate({ key: setting.id, value })}
                />
              </Fragment>
            ))}
          </div>
        </div>
      ))}

      <AkTypography color="textSecondary" className="max-w-175" data-test-notification-note>
        {akMT('accountNotifSettings.notificationNote')}
      </AkTypography>
    </section>
  );
}
