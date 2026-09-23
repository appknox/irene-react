import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

/**
 * A value the invitation fixed, shown in the form's own shape but not asked for.
 *
 * @param props.id - Ties the label to the field.
 * @param props.label - What the value is.
 * @param props.value - The value itself.
 */
export function RegisterViaInviteReadOnlyField({
  id,
  label,
  value,
}: Readonly<{ id: string; label: string; value: string }>) {
  return (
    <div className="grid gap-1.5">
      <AkLabel htmlFor={id} className="text-md font-medium">
        {label}
      </AkLabel>

      <AkInput id={id} value={value} readOnly disabled data-test-invited-value />
    </div>
  );
}
