import { z } from 'zod';
import { akMT } from '@irene/translations/intl';

/**
 * The new password, twice. Built per render, so its messages follow the active
 * locale.
 *
 * @returns The schema.
 */
export const buildResetPasswordSchema = () =>
  z
    .object({
      password: z.string().min(1, akMT('enterNewPassword')),
      confirm_password: z.string().min(1, akMT('enterConfirmPassword')),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: akMT('passwordMatchError'),
      path: ['confirm_password'],
    });

export type ResetPasswordFormSchema = z.infer<ReturnType<typeof buildResetPasswordSchema>>;
