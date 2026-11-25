import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

import { expiryDateIn } from '../expiry';
import { SectionCard } from './section-card';
import { EditControl, EditFooter } from './section-edit';

interface AccessTokenSectionProps {
  /** The account as it stands, where the section is reading one rather than making it. */
  serviceAccount?: ApiServiceAccount;

  /** Whether a new key is being settled, which replaces the one the account has. */
  isEditing?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;

  /**
   * The secret the API answers with once, which is shown here rather than lost.
   *
   * irene carries it to the details screen; until that screen is this app's,
   * showing it where it was minted is what keeps it recoverable at all.
   */
  secret?: string;

  /** How many days from today the token lasts, which irene counts from one. */
  expiryInDays: number;
  onExpiryInDaysChange: (days: number) => void;

  doesNotExpire: boolean;
  onDoesNotExpireChange: (doesNotExpire: boolean) => void;
}

/**
 * How long the account's token lasts.
 *
 * The token itself is not here yet: it is answered once the account is made,
 * which is what the description says. Until then this only settles the expiry —
 * a number of days from today, or none at all.
 *
 * @param props.expiryInDays - Days from today, which the field and its two controls change.
 * @param props.onExpiryInDaysChange - Called with the new number of days.
 * @param props.doesNotExpire - Whether the token is to last indefinitely.
 * @param props.onDoesNotExpireChange - Called when that is chosen or unchosen.
 */
export function AccessTokenSection({
  serviceAccount,
  isEditing = false,
  onEdit,
  onRegenerate,
  onCancel,
  isSaving = false,
  secret,
  expiryInDays,
  onExpiryInDaysChange,
  doesNotExpire,
  onDoesNotExpireChange,
}: Readonly<AccessTokenSectionProps>) {
  /* irene counts in whole days from one: anything lower, or not a number, reads as one. */
  const readDays = (value: string) => {
    const days = Number.parseInt(value.trim(), 10);

    return Number.isNaN(days) || days <= 1 ? 1 : days;
  };

  /* A made account reads its key until a new one is asked for. */
  if (serviceAccount && !isEditing) {
    return (
      <SectionCard
        title={akMT('accessToken')}
        testAttribute="service-account-token"
        headerAction={
          onEdit && (
            <EditControl
              label={akMT('serviceAccountModule.refreshAccessToken')}
              onEdit={onEdit}
              testAttribute="service-account-token-edit"
            />
          )
        }
      >
        <div className="flex flex-col gap-1">
          <AkTypography variant="subtitle1">{akMT('accessKeyID')}</AkTypography>

          <AkTypography data-test-service-account-key-value>
            {serviceAccount.access_key_id}
          </AkTypography>
        </div>

        <div className="mt-5.25 flex flex-col gap-1">
          <AkTypography variant="subtitle1">
            {akMT('serviceAccountModule.secretAccessKey')}
          </AkTypography>

          {secret ? (
            <AkTypography noWrap data-test-service-account-secret-value>
              {secret}
            </AkTypography>
          ) : (
            /* Answered once and never again, so all that is left of it is its length. */
            <AkTypography
              variant="h1"
              className="leading-none"
              data-test-service-account-secret-masked
            >
              ..............
            </AkTypography>
          )}

          <div className="mt-3.5 flex items-center gap-1">
            <AkIcon
              name="material-symbols:description"
              className="size-4 text-primary"
              aria-hidden
            />

            <AkTypography
              variant="body2"
              color={secret ? 'primary' : 'textSecondary'}
              data-test-service-account-secret-note
            >
              {secret
                ? akMT('serviceAccountModule.unmaskedSecretAccessKeyHelperText')
                : akMT('serviceAccountModule.maskedSecretAccessKeyHelperText')}
            </AkTypography>
          </div>
        </div>

        <div className="mt-5.25 flex flex-col gap-1">
          <AkTypography variant="subtitle1">{akMT('expiresOn')}</AkTypography>

          <AkTypography data-test-service-account-expiry-value>
            {serviceAccount.expiry === null
              ? akMT('noExpiry')
              : formatDateTime(serviceAccount.expiry, DateTimeFormat.ll)}
          </AkTypography>
        </div>
      </SectionCard>
    );
  }

  if (secret && !serviceAccount) {
    return (
      <SectionCard title={akMT('accessToken')} testAttribute="service-account-token">
        <AkTypography data-test-service-account-secret-note>
          {akMT('serviceAccountModule.accessTokenCreateDescription')}
        </AkTypography>

        <AkInput
          readOnly
          value={secret}
          className="mt-3.5"
          aria-label={akMT('accessToken')}
          data-test-service-account-secret
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={akMT('accessToken')}
      testAttribute="service-account-token"
      headerColor={isEditing ? 'primary' : 'default'}
      footerAction={
        isEditing &&
        onRegenerate &&
        onCancel && (
          <EditFooter
            isSaving={isSaving}
            onSave={onRegenerate}
            onCancel={onCancel}
            saveLabel={akMT('serviceAccountModule.regenerateKey')}
            testAttribute="service-account-token"
          />
        )
      }
    >
      <AkTypography data-test-service-account-token-description>
        {isEditing
          ? akMT('serviceAccountModule.accessTokenEditDescription')
          : akMT('serviceAccountModule.accessTokenCreateDescription')}
      </AkTypography>

      <div className="mt-5.25 flex items-center gap-2.75">
        <div className="flex items-center">
          <AkInput
            value={expiryInDays}
            disabled={doesNotExpire}
            aria-label={akMT('days')}
            wrapperClassName="w-31.25"
            onChange={(event) => onExpiryInDaysChange(readDays(event.target.value))}
            data-test-service-account-expiry-days
            rightAdornment={
              <div className="flex items-center gap-1.75">
                <AkIconButton
                  size="small"
                  disabled={doesNotExpire || expiryInDays === 1}
                  aria-label={akMT('decrease')}
                  onClick={() => onExpiryInDaysChange(Math.max(1, expiryInDays - 1))}
                  data-test-service-account-expiry-decrement
                >
                  <AkIcon name="material-symbols:remove" />
                </AkIconButton>

                <span className="h-4 w-px bg-border" />

                <AkIconButton
                  size="small"
                  disabled={doesNotExpire}
                  aria-label={akMT('increase')}
                  onClick={() => onExpiryInDaysChange(expiryInDays + 1)}
                  data-test-service-account-expiry-increment
                >
                  <AkIcon name="material-symbols:add" />
                </AkIconButton>
              </div>
            }
          />

          <span className="w-7 border-b border-dashed border-border" />

          <AkTypography
            tag="span"
            fontWeight="medium"
            color="secondary"
            className="rounded-md bg-neutral-100 px-2.75 py-1"
            data-test-service-account-expiry-unit
          >
            {akMT('days')}
          </AkTypography>
        </div>

        <span className="ml-1.75 h-7.5 w-px bg-border" />

        <div className="flex items-center gap-1.75">
          <AkCheckbox
            id="service-account-does-not-expire"
            checked={doesNotExpire}
            onCheckedChange={(checked) => onDoesNotExpireChange(checked === true)}
            data-test-service-account-no-expiry
          />

          <AkLabel htmlFor="service-account-does-not-expire">
            {akMT('serviceAccountModule.doesNotExpire')}
          </AkLabel>
        </div>
      </div>

      <AkTypography
        color="secondary"
        fontWeight="medium"
        className="mt-3.5"
        data-test-service-account-expiry-note
      >
        {doesNotExpire ? (
          akMT('serviceAccountModule.doesNotExpireHelperText')
        ) : (
          <AkMessageTranslate
            id="serviceAccountModule.expiryHelperText"
            values={{
              date: formatDateTime(expiryDateIn(expiryInDays), DateTimeFormat.ll),
            }}
          />
        )}
      </AkTypography>
    </SectionCard>
  );
}
