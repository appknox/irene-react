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
      confirmPassword: z.string().min(1, akMT('enterConfirmPassword')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: akMT('passwordMatchError'),
      path: ['confirmPassword'],
    });

export type ResetPasswordFormSchema = z.infer<ReturnType<typeof buildResetPasswordSchema>>;
