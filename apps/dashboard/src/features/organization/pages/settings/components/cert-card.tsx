import dayjs from 'dayjs';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOrganizationSigningCertificate } from '@irene/api/services/organization';

/* The pattern an expiry is written in, rather than one of the locale's own. */
const EXPIRES_ON_FORMAT = 'MMMM D, YYYY, hh:mm A';

interface CertCardProps {
  certificate: ApiOrganizationSigningCertificate;

  /** Whether an activation is in flight for this one, which holds its control. */
  isActivating: boolean;

  /** Whether the organization keeps others, which decides if the active one may go. */
  hasSiblings: boolean;
  onActivate: (certificate: ApiOrganizationSigningCertificate) => void;
  onDelete: (certificate: ApiOrganizationSigningCertificate) => void;
}

/** One line of what a certificate is: a label and its value. */
function CertMeta({
  label,
  value,
  isExpired,
}: Readonly<{ label: string; value: string; isExpired?: boolean }>) {
  return (
    <div className="flex items-center gap-1">
      <AkTypography color="textSecondary" data-test-org-signing-cert-meta-label>
        {`${label}:`}
      </AkTypography>

      <AkTypography
        fontWeight="medium"
        color={isExpired ? 'error' : undefined}
        data-test-org-signing-cert-meta-value
      >
        {value}
      </AkTypography>
    </div>
  );
}

/**
 * One signing certificate, as a bordered card.
 *
 * The active one carries a badge and offers nothing to press; the others offer
 * to take its place. The active one may not be deleted while others remain,
 * which the endpoint refuses, so the control is held back and says why.
 *
 * @param props.certificate - The certificate this card is about.
 * @param props.isActivating - Whether an activation is in flight for it.
 * @param props.hasSiblings - Whether the organization keeps others.
 * @param props.onActivate - Called to make it the one apps are re-signed with.
 * @param props.onDelete - Called to ask before removing it.
 */
export function CertCard({
  certificate,
  isActivating,
  hasSiblings,
  onActivate,
  onDelete,
}: Readonly<CertCardProps>) {
  const isDeleteHeldBack = certificate.is_active && hasSiblings;

  return (
    <div
      className="flex items-start justify-between gap-3.5 rounded-xs border border-border p-3.5"
      data-test-org-signing-cert-card
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.75">
          <AkTypography fontWeight="bold" data-test-org-signing-cert-name>
            {certificate.name ?? akMT('cyod.signingCert.unnamed')}
          </AkTypography>

          {certificate.is_active && (
            <AkChip
              variant="filled"
              size="small"
              color="success"
              label={akMT('activeCapital')}
              data-test-org-signing-cert-active-badge
            />
          )}

          <AkChip
            variant="semi-filled"
            size="small"
            color={certificate.is_expired ? 'error' : 'success'}
            label={certificate.is_expired ? akMT('expired') : akMT('cyod.signingCert.statusValid')}
            data-test-org-signing-cert-status
          />
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <CertMeta label={akMT('team')} value={certificate.team_id ?? ''} />

          {certificate.app_id !== null && (
            <CertMeta label={akMT('cyod.signingCert.appId')} value={certificate.app_id} />
          )}

          <CertMeta
            label={akMT('expires')}
            isExpired={certificate.is_expired}
            value={
              certificate.expires_at === null
                ? ''
                : dayjs(certificate.expires_at).format(EXPIRES_ON_FORMAT)
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-1.75">
        {!certificate.is_active && !certificate.is_expired && (
          <AkButton
            type="button"
            variant="outlined"
            loading={isActivating}
            disabled={isActivating}
            onClick={() => onActivate(certificate)}
            data-test-org-signing-cert-activate
          >
            {akMT('cyod.signingCert.makeActive')}
          </AkButton>
        )}

        <AkTooltip
          arrow
          side="top"
          title={isDeleteHeldBack ? akMT('cyod.signingCert.deleteActiveHint') : akMT('delete')}
        >
          <AkIconButton
            type="button"
            size="small"
            disabled={isDeleteHeldBack}
            aria-label={akMT('delete')}
            onClick={() => onDelete(certificate)}
            data-test-org-signing-cert-delete
          >
            <AkIcon name="material-symbols:delete" />
          </AkIconButton>
        </AkTooltip>
      </div>
    </div>
  );
}
