import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/**
 * The current password, then the new one twice. irene checks only that each is
 * present and that the two new ones match; the server judges the rest, and its
 * complaints land on the field they name. Built per render, so its messages
 * follow the active locale.
 *
 * @returns The schema.
 */
export const buildChangePasswordSchema = () =>
  z
    .object({
      old_password: z.string().min(1, akMT('enterCurrentPassword')),
      password: z.string().min(1, akMT('enterNewPassword')),
      confirm_password: z.string(),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: akMT('passwordMatchError'),
      path: ['confirm_password'],
    });

export type ChangePasswordFormSchema = z.infer<ReturnType<typeof buildChangePasswordSchema>>;

/**
 * The field this form's controls are built from, bound to the schema above so
 * every `name` is checked against it.
 */
export const ChangePasswordFormField = createAkFormField<ChangePasswordFormSchema>();
