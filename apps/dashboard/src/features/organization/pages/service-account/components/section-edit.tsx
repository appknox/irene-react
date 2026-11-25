import { Fragment, type ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTooltip } from '@irene/ui/ak-tooltip';

interface EditControlProps {
  /** What the control says it opens, which irene words as "Edit <section>". */
  label: string;
  onEdit: () => void;
  testAttribute: string;
}

/**
 * The control that opens a section for changes.
 *
 * @param props.label - What it says it opens.
 * @param props.onEdit - Called to open the section.
 * @param props.testAttribute - Names the control's `data-test-*` attribute.
 */
export function EditControl({ label, onEdit, testAttribute }: Readonly<EditControlProps>) {
  return (
    <AkTooltip arrow title={label}>
      <AkIconButton
        type="button"
        variant="outlined"
        aria-label={label}
        className="border-0 bg-background"
        onClick={onEdit}
        {...{ [`data-test-${testAttribute}`]: true }}
      >
        <AkIcon name="material-symbols:edit" />
      </AkIconButton>
    </AkTooltip>
  );
}

interface EditFooterProps {
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  testAttribute: string;

  /** What the saving control says, where it is not simply "update". */
  saveLabel?: ReactNode;
}

/**
 * The controls under a section that is open for changes.
 *
 * @param props.isSaving - Marks the saving control busy, and closes off cancel.
 * @param props.onSave - Called to write the change.
 * @param props.onCancel - Called to leave the section as it was.
 * @param props.testAttribute - Names the controls' `data-test-*` attributes.
 * @param props.saveLabel - Replaces "update" on the saving control.
 */
export function EditFooter({
  isSaving,
  onSave,
  onCancel,
  testAttribute,
  saveLabel,
}: Readonly<EditFooterProps>) {
  return (
    <Fragment>
      {/* A section sits inside a form, so neither control may submit it: the save is its own. */}
      <AkButton
        type="button"
        loading={isSaving}
        onClick={onSave}
        {...{ [`data-test-${testAttribute}-save`]: true }}
      >
        {saveLabel ?? akMT('update')}
      </AkButton>

      <AkButton
        type="button"
        variant="outlined"
        color="neutral"
        disabled={isSaving}
        onClick={onCancel}
        {...{ [`data-test-${testAttribute}-cancel`]: true }}
      >
        {akMT('cancel')}
      </AkButton>
    </Fragment>
  );
}
