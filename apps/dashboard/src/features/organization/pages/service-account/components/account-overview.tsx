import { akMT } from '@irene/translations/intl';
import { AkInput } from '@irene/ui/ak-input';
import { AkTextarea } from '@irene/ui/ak-textarea';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

import { ServiceAccountFormField } from '../schemas/create';
import { AuditInfo } from './audit-info';
import { SectionCard } from './section-card';
import { EditControl, EditFooter } from './section-edit';

interface AccountOverviewProps {
  /** The account as it stands, where the section is reading one rather than making it. */
  serviceAccount?: ApiServiceAccount;

  /** Whether it is open for changes, which only the account's own screen offers. */
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

/**
 * What the account is called and what it is for.
 *
 * Both are required, which is what irene's own validator asks of them. An
 * account that already exists reads them until the section is opened, and the
 * audit sits behind the mark beside its name.
 *
 * @param props.serviceAccount - The account being read, absent while one is being made.
 * @param props.isEditing - Whether the fields are open for changes.
 * @param props.onEdit - Called to open them.
 * @param props.onSave - Called to write them.
 * @param props.onCancel - Called to leave them as they were.
 * @param props.isSaving - Marks the saving control busy.
 */
export function AccountOverviewSection({
  serviceAccount,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
}: Readonly<AccountOverviewProps> = {}) {
  const isReading = Boolean(serviceAccount) && !isEditing;

  if (isReading && serviceAccount) {
    return (
      <SectionCard
        title={akMT('accountOverview')}
        testAttribute="service-account-overview"
        headerAction={
          onEdit && (
            <EditControl
              label={`${akMT('edit')} ${akMT('accountOverview')}`}
              onEdit={onEdit}
              testAttribute="service-account-overview-edit"
            />
          )
        }
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.75">
            <AkTypography variant="subtitle1">
              {akMT('serviceAccountModule.nameOfTheServiceAccount')}
            </AkTypography>

            <AuditInfo serviceAccount={serviceAccount} />
          </div>

          <AkTypography data-test-service-account-name-value>{serviceAccount.name}</AkTypography>
        </div>

        <div className="mt-5.25 flex flex-col gap-1">
          <AkTypography variant="subtitle1">{akMT('description')}</AkTypography>

          <AkTypography data-test-service-account-description-value>
            {serviceAccount.description}
          </AkTypography>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={akMT('accountOverview')}
      testAttribute="service-account-overview"
      headerColor={isEditing ? 'primary' : 'default'}
      footerAction={
        isEditing &&
        onSave &&
        onCancel && (
          <EditFooter
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancel}
            testAttribute="service-account-overview"
          />
        )
      }
    >
      <ServiceAccountFormField
        name="name"
        label={`${akMT('serviceAccountModule.nameOfTheServiceAccount')} *`}
        labelProps={{ className: 'text-base font-medium' }}
      >
        <AkInput data-test-service-account-name-input />
      </ServiceAccountFormField>

      <ServiceAccountFormField
        name="description"
        label={`${akMT('description')} *`}
        labelProps={{ className: 'text-base font-medium' }}
        className="mt-5.25"
      >
        <AkTextarea rows={6} data-test-service-account-description-input />
      </ServiceAccountFormField>
    </SectionCard>
  );
}
