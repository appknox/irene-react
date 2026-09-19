import {
  useFormContext,
  useWatch,
  type FieldPathByValue,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

/**
 * Tracks whether a required text field is still empty, so the step's button can
 * be disabled until it is filled.
 *
 * An empty field is the form being incomplete, not the user being wrong, so a
 * caller uses this for two things: disabling the step's button, and hiding that
 * field's message. Clearing the error instead would lose a race with the
 * resolver, which revalidates asynchronously after every change.
 *
 * Only string fields are accepted. A number field holding `0`, or a ticked
 * checkbox, would otherwise read as empty and leave its button disabled on a
 * value the user did supply.
 *
 * @param name - The field to watch. Must hold a string.
 * @param form - The form, when the caller owns it rather than sitting inside `AkFormProvider`.
 * @returns Whether the field is empty.
 */
export function useRequiredField<TFieldValues extends FieldValues>(
  name: FieldPathByValue<TFieldValues, string>,
  form?: UseFormReturn<TFieldValues>
) {
  const context = useFormContext<TFieldValues>();
  const { control } = form ?? context;
  const value = useWatch<TFieldValues>({ control, name });

  return typeof value !== 'string' || value.trim() === '';
}
