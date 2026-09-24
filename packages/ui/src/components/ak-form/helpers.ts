import { createElement } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { AkFormField, type AkFormFieldProps } from '@irene/ui/ak-form';

/**
 * Binds `AkFormField` to one form's values, so its `name` is checked against
 * that schema.
 *
 * `AkFormField` on its own infers `FieldValues` from an unannotated call site,
 * which accepts any string: a mistyped name then registers a field the schema
 * has never heard of, and it silently never validates. Calling this once per
 * form gives the compiler the shape to check against.
 *
 * Call it at module scope. A component built during a render is a new type on
 * every pass, which remounts the field and loses what was typed into it.
 *
 * @example
 * const LoginField = createAkFormField<LoginFormSchema>();
 * <LoginField name="username" label={akMT('username')}><AkInput /></LoginField>
 *
 * @returns A field component that only accepts this form's own names.
 */
export function createAkFormField<TFieldValues extends FieldValues>() {
  return function AkBoundFormField<TName extends FieldPath<TFieldValues>>(
    props: AkFormFieldProps<TFieldValues, TName>
  ) {
    return createElement(AkFormField<TFieldValues, TName>, props);
  };
}
