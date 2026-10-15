import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/**
 * The name a new API token is generated under. irene refuses a name that is
 * only spaces, and the server trims what it is sent, so the name is trimmed
 * here. Built per render, so its message follows the active locale.
 *
 * @returns The schema.
 */
export const buildPersonalTokenSchema = () =>
  z.object({
    name: z.string().trim().min(1, akMT('enterTokenName')),
  });

export type PersonalTokenFormSchema = z.infer<ReturnType<typeof buildPersonalTokenSchema>>;

/**
 * The field this form's control is built from, bound to the schema above so
 * its `name` is checked against it.
 */
export const PersonalTokenFormField = createAkFormField<PersonalTokenFormSchema>();
