import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

/** The name, and what the command line may do with the account where it may. */
export function ServiceAccountName({
  serviceAccount,
}: Readonly<{ serviceAccount: ApiServiceAccount }>) {
  return (
    <div className="flex flex-col gap-1">
      <AkTypography noWrap title={serviceAccount.name} data-test-service-account-name>
        {serviceAccount.name}
      </AkTypography>

      {serviceAccount.scope_cli && (
        <div className="flex gap-1">
          <AkChip
            size="small"
            variant="outlined"
            label={akMT('serviceAccountModule.cliLabel')}
            icon={<AkIcon name="material-symbols:terminal-2" />}
            data-test-service-account-cli
          />

          <AkChip
            size="small"
            variant="outlined"
            label={
              serviceAccount.all_projects
                ? akMT('serviceAccountModule.ownerLevelLabel')
                : akMT('serviceAccountModule.memberLevelLabel')
            }
            data-test-service-account-cli-level
          />
        </div>
      )}
    </div>
  );
}

/** When the account stops working, or that it never does — which irene marks as a warning. */
export function ServiceAccountExpiry({
  serviceAccount,
}: Readonly<{ serviceAccount: ApiServiceAccount }>) {
  const neverExpires = serviceAccount.expiry === null;

  return (
    <AkChip
      variant="semi-filled"
      color={neverExpires ? 'warn' : 'default'}
      label={
        neverExpires ? akMT('noExpiry') : formatDateTime(serviceAccount.expiry, DateTimeFormat.ll)
      }
      icon={<AkIcon name={neverExpires ? 'material-symbols:warning' : 'material-symbols:event'} />}
      data-test-service-account-expiry
    />
  );
}
