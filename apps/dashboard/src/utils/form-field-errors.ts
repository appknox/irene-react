import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import { getApiFieldErrors } from '@irene/api/utils/errors';

/**
 * One complaint the API made about one field of a form.
 *
 * @interface FormFieldError
 * @property {Path} field - The field it belongs to.
 * @property {string} message - The API's own wording.
 */
export interface FormFieldError<TValues extends FieldValues> {
  field: Path<TValues>;
  message: string;
}

/**
 * Picks the complaints a refused request made about fields the form holds.
 *
 * A form schema carries the API's own field names, so no lookup table is
 * needed: the fields are read off the schema's shape, which stays in step with
 * the form because the form is built from the same schema.
 *
 * Anything the API names that the form does not hold — `detail`,
 * `non_field_errors`, or nothing at all on a 500 — is left out, so an empty
 * result tells the caller to raise the refusal some other way.
 *
 * @param schema - The schema the form was built from, read for its field names.
 * @param error - Whatever the request rejected with.
 * @returns One entry per field the refusal named, in the schema's own order.
 */
export function toFormFieldErrors<TValues extends FieldValues>(
  schema: z.ZodObject<z.core.$ZodLooseShape>,
  error: unknown
): Array<FormFieldError<TValues>> {
  const messages = getApiFieldErrors(error);

  /*
    Object.keys is typed string[] however well the object is typed, so the field
    names are narrowed back to the form's own. Sound here: the shape is the
    schema the form was built from, so its keys are that form's fields.
  */
  const fields = Object.keys(schema.shape) as Array<Path<TValues>>;

  return fields.flatMap((field) => {
    const message = messages[field]?.[0];

    return message ? [{ field, message }] : [];
  });
}

/**
 * Reports each complaint on the field it belongs to.
 *
 * @param form - The form to report on.
 * @param fieldErrors - What `toFormFieldErrors` picked out.
 */
export function setFormFieldErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  fieldErrors: Array<FormFieldError<TValues>>
) {
  fieldErrors.forEach(({ field, message }) => {
    form.setError(field, { message });
  });
}
