import { akMT } from '@irene/translations/intl';
import type { ApiServiceAccountScopes } from '@irene/api/services/service-account';

import { ScopeTree } from './scope-tree';
import { SectionCard } from './section-card';
import { EditControl, EditFooter } from './section-edit';
import type { ScopeNode } from '../scopes';

interface SelectScopeSectionProps {
  scopes: ApiServiceAccountScopes;
  onChange: (node: ScopeNode, isGranted: boolean) => void;

  /** Whether the scopes are read rather than set, which an account's own screen opens. */
  isReading?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

/**
 * What the account being made may do.
 *
 * @param props.scopes - The scopes as they stand.
 * @param props.onChange - Called with the row that was granted or withdrawn.
 * @param props.isReading - Whether the section belongs to an account that already exists.
 * @param props.isEditing - Whether that account's scopes are open for changes.
 * @param props.onEdit - Called to open them.
 * @param props.onSave - Called to write them.
 * @param props.onCancel - Called to leave them as they were.
 * @param props.isSaving - Marks the saving control busy.
 */
export function SelectScopeSection({
  scopes,
  onChange,
  isReading = false,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
}: Readonly<SelectScopeSectionProps>) {
  const isOpen = !isReading || isEditing;

  return (
    <SectionCard
      title={isOpen ? akMT('selectScope') : akMT('selectedScope')}
      testAttribute="service-account-scope"
      headerColor={isEditing ? 'primary' : 'default'}
      headerAction={
        isReading &&
        !isEditing &&
        onEdit && (
          <EditControl
            label={`${akMT('edit')} ${akMT('selectedScope')}`}
            onEdit={onEdit}
            testAttribute="service-account-scope-edit"
          />
        )
      }
      footerAction={
        isEditing &&
        onSave &&
        onCancel && (
          <EditFooter
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancel}
            testAttribute="service-account-scope"
          />
        )
      }
    >
      <ScopeTree scopes={scopes} onChange={isOpen ? onChange : undefined} />
    </SectionCard>
  );
}
