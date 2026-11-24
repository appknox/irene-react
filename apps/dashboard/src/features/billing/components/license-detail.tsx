import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import type { ApiLicense } from '@irene/api/services/billing';
import type { IconName } from '@irene/ui/icons/sets';

import { formatBillingDate, hasPassed, isEndingSoon } from '@/features/billing/utils';

import { BillingSection } from './billing-section';

interface LicenseGroup {
  id: string;
  icon: IconName;
  title: string;
  details: { label: string; value: string; isCode?: boolean }[];
}

/**
 * The enterprise license a self-hosted deployment runs under: what it covers,
 * how long for, and who it is registered to.
 *
 * A license counts either apps or scans, never both, so the quantity and plan
 * shown are whichever half `is_limited_scans` names. One that has lapsed, or
 * ends within `EXPIRY_WARNING_DAYS`, says so above its details, since scanning
 * stops with it.
 *
 * @param props.license - The license.
 */
export function LicenseDetail({ license }: Readonly<{ license: ApiLicense }>) {
  const isPerScan = license.is_limited_scans;
  const isActive = license.status === 'Active';
  const hasExpired = !isActive || hasPassed(license.expiry_date);
  const expiresSoon = !hasExpired && isEndingSoon(license.expiry_date);

  const groups: LicenseGroup[] = [
    {
      id: 'feature',
      icon: 'material-symbols:shape-line',
      title: akMT('feature'),
      details: [
        isPerScan
          ? { label: akMT('noOfScans'), value: String(license.per_scan_quantity) }
          : { label: akMT('noOfApps'), value: String(license.per_app_quantity) },
        {
          label: akMT('planType'),
          value: isPerScan ? license.per_scan_description : license.per_app_description,
        },
      ],
    },
    {
      id: 'validity',
      icon: 'material-symbols:calendar-month',
      title: akMT('validity'),
      details: [
        { label: akMT('startDate'), value: formatBillingDate(license.start_date) },
        { label: akMT('expiryDate'), value: formatBillingDate(license.expiry_date) },
      ],
    },
    {
      id: 'registration',
      icon: 'material-symbols:person',
      title: akMT('registration'),
      details: [
        { label: akMT('licenseKey'), value: license.key, isCode: true },
        { label: akMT('licensedTo'), value: `${license.name} <${license.email}>` },
      ],
    },
  ];

  return (
    <BillingSection
      title={akMT('license')}
      action={
        <div className="flex items-center gap-2.5">
          <AkTypography variant="subtitle1">
            {isPerScan ? license.per_scan_name : license.per_app_name}
          </AkTypography>

          <AkChip
            variant="semi-filled"
            size="small"
            color={isActive ? 'success' : 'error'}
            label={license.status}
            data-test-license-status
          />
        </div>
      }
    >
      {hasExpired && (
        <AkAlert variant="error" data-test-license-expired>
          <AkIcon name="material-symbols:error" />

          <AkAlertDescription>{akMT('licenseExpiredWarning')}</AkAlertDescription>
        </AkAlert>
      )}

      {expiresSoon && (
        <AkAlert variant="warning" data-test-license-expiring>
          <AkIcon name="material-symbols:warning" />

          <AkAlertDescription>
            {akMT('licenseExpiringWarning', { date: formatBillingDate(license.expiry_date) })}
          </AkAlertDescription>
        </AkAlert>
      )}

      <div className="grid gap-5.25 md:grid-cols-3" data-test-license-detail>
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-3.5" data-test-license-group={group.id}>
            <div className="flex items-center gap-1.75">
              <AkIcon name={group.icon} className="size-4.5 text-foreground-muted" />

              <AkTypography variant="subtitle1">{group.title}</AkTypography>
            </div>

            <dl className="flex flex-col gap-2.5">
              {group.details.map((detail) => (
                <div key={detail.label} className="flex flex-col gap-0.5">
                  <AkTypography tag="dt" variant="body2" color="textSecondary">
                    {detail.label}
                  </AkTypography>

                  <dd className="flex items-start gap-1">
                    <AkTypography
                      tag="span"
                      fontWeight="medium"
                      className={detail.isCode ? 'font-mono break-all' : 'break-words'}
                    >
                      {detail.value}
                    </AkTypography>

                    {detail.isCode && <CopyLicenseKey licenseKey={detail.value} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </BillingSection>
  );
}

/**
 * Copies the license key, which is long and usually pasted into an email to support.
 *
 * @param props.licenseKey - The key.
 */
function CopyLicenseKey({ licenseKey }: Readonly<{ licenseKey: string }>) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      akNotify.success(akMT('copiedToClipboard'));
    } catch {
      /* A browser that refuses the clipboard (an insecure origin, a denied permission) says so here. */
      akNotify.error(akMT('somethingWentWrong'));
    }
  };

  return (
    <AkIconButton
      size="small"
      aria-label={akMT('copy')}
      className="-mt-0.5 shrink-0 text-primary"
      onClick={copy}
      data-test-license-key-copy
    >
      <AkIcon name="material-symbols:content-copy" />
    </AkIconButton>
  );
}
