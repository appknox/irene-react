import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/**
 * The account to send a password reset link to. Built per render, so its
 * messages follow the active locale.
 *
 * @returns The schema.
 */
export const buildRecoverSchema = () =>
  z.object({
    username: z.string().trim().min(1, akMT('usernameEmailIdTextPlaceholder')),
  });

export type RecoverFormSchema = z.infer<ReturnType<typeof buildRecoverSchema>>;

/**
 * The field this form's controls are built from, bound to the schema above so
 * every `name` is checked against it.
 */
export const RecoverFormField = createAkFormField<RecoverFormSchema>();
