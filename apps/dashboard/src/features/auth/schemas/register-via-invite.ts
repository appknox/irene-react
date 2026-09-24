import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/**
 * The account an invitation is redeemed for. Built per render, so its messages
 * follow the active locale.
 *
 * The address is not here: it comes from the invitation and cannot be changed.
 *
 * @returns The schema.
 */
export const buildRegisterViaInviteSchema = () =>
  z
    .object({
      company: z.string().trim().min(1, akMT('companyNameRequired')),
      first_name: z.string().trim(),
      last_name: z.string().trim(),
      username: z.string().trim().min(3, akMT('usernameMinLengthError')),
      password: z.string().min(10, akMT('passwordMinLengthError')),
      confirm_password: z.string().min(1, akMT('enterConfirmPassword')),
      terms_accepted: z.boolean().refine((accepted) => accepted, akMT('acceptTermsError')),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: akMT('passwordMatchError'),
      path: ['confirm_password'],
    });

export type RegisterViaInviteFormSchema = z.infer<ReturnType<typeof buildRegisterViaInviteSchema>>;

/**
 * The field this form's controls are built from, bound to the schema above so
 * every `name` is checked against it.
 */
export const RegisterViaInviteFormField = createAkFormField<RegisterViaInviteFormSchema>();
